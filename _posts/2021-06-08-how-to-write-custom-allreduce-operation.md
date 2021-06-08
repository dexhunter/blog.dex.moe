---
layout: post
title: "How to Write A Custom Allreduce Operation in Horovod"
date: 2021-06-08 21:11:02
categories: tutorial
tags: horovod distributed machine-learning allreduce algorithm
---

# How to Write Custom Allreduce Operator in Horovod

## Prequisites

* Version: Python >= 3.6
* Install CMake, e.g.
```
$ sudo apt-get update 
$ sudo apt-get install build-essential libssl-dev
$ sudo apt-get install cmake
```

* Download horovod source code
```
$ git clone https://github.com/horovod/horovod.git
```
* Install third party modules
```
$ cd horovod
$ git submodule --init --recursive update
```
* *Recommended*: Use a virtual environment
```
$ virtualenv hvdenv
$ . hvdenv/bin/activate
```
* Install Tensorflow, Pytorch and/or MXNet
* Download/Install NCCL2/MPI

## Intro

As documented in [Horovod Contributor Guide](https://horovod.readthedocs.io/en/stable/contributors_include.html#adding-custom-operations), the base allreduce operation is `AllreduceOp` which is definted at [`collective_operations.cc`](https://github.com/horovod/horovod/blob/master/horovod/common/ops/collective_operations.h#L51)

## Methodology

For example, we want to write our custom hierarchical allreduce operator (`NCCL_REDUCE`+`NCCL_ALLREDUCE`+`NCCL_BCAST`) based on the existing one (`NCCL_REDUCESCATTER`+`MPI_ALLREDUCE`+`NCCL_ALLGATHER`).

### 1 Hot-fix

1. Navigate to `nccl_operations.cc`
2. Find `NCCLAllreduce::Execute`
3. Replace Code with CustomNCCLHierarchicalAllreduceOp
```cpp
#if HAVE_MPI
Status
NCCLHierarchicalAllreduce::Execute(std::vector<TensorTableEntry>& entries,
                                   const Response& response) {
  auto& first_entry = entries[0];

  // Determine GPU IDs of the devices participating in this communicator.
  std::vector<int32_t> nccl_device_map;
  nccl_device_map.reserve(
      global_state_->controller->GetLocalCommRanks().size());
  for (int rank : global_state_->controller->GetLocalCommRanks()) {
    nccl_device_map.push_back(response.devices()[rank]);
  }

  gpu_op_context_.InitGPU(entries);
  nccl_op_context_.InitNCCLComm(entries, nccl_device_map);
  gpu_op_context_.InitGPUQueue(entries, response);

  const void* fused_input_data;
  void* buffer_data;
  size_t buffer_len;

  // Copy memory into the fusion buffer.
  if (entries.size() > 1) {
    MemcpyInFusionBuffer(entries, fused_input_data, buffer_data, buffer_len);

    if (global_state_->timeline.Initialized()) {
      gpu_context_->RecordEvent(gpu_op_context_.event_queue, MEMCPY_IN_FUSION_BUFFER, *gpu_op_context_.stream);
    }
  } else {
    fused_input_data = first_entry.tensor->data();
    buffer_data = (void*) first_entry.output->data();
    buffer_len = (size_t) first_entry.output->size();
  }

  int64_t num_elements = buffer_len / DataType_Size(first_entry.tensor->dtype());

  if (response.prescale_factor() != 1.0) {
    // Execute prescaling op
    ScaleBuffer(response.prescale_factor(), entries, fused_input_data, buffer_data, num_elements);
    fused_input_data = buffer_data; // for unfused, scale is done out of place
  }

  // Do allreduce.
  int element_size = mpi_context_->GetMPITypeSize(first_entry.tensor->dtype());
  int local_size = global_state_->controller->GetLocalSize();
  int local_rank = global_state_->controller->GetLocalRank();

  // If cluster is homogeneous and we are using fusion buffer, include
  // dummy elements from the buffer (if necessary) to make sure the data
  // is divisible by local_size. This is always possible since we
  // set the fusion buffer size divisible by local_size.
  if (global_state_->controller->IsHomogeneous() && entries.size() > 1) {
    // Making sure the number of elements is divisible by
    // FUSION_BUFFER_ATOMIC_UNIT for improved performance
    int div = local_size * FUSION_BUFFER_ATOMIC_UNIT;
    num_elements = ((num_elements + div - 1) / div) * div;
    buffer_len = num_elements * element_size;
  }

 

  int root_rank =
      global_state_->controller->IsHomogeneous() ? local_size - 1 : 0;

  auto& timeline = global_state_->timeline;



  auto nccl_result = ncclReduce(fused_input_data,
                                buffer_data,
                                (size_t) num_elements,
                                GetNCCLDataType(first_entry.tensor), ncclSum,
                                root_rank, *nccl_op_context_.nccl_comm_, *gpu_op_context_.stream);
  nccl_context_->ErrorCheck("ncclReduce", nccl_result, *nccl_op_context_.nccl_comm_);
  if (global_state_->timeline.Initialized()) {
    gpu_context_->RecordEvent(gpu_op_context_.event_queue, NCCL_REDUCE, *gpu_op_context_.stream);
  }

  nccl_context_->ErrorCheck("ncclAllReduce", 
                            ncclAllReduce(fused_input_data, buffer_data,
                                   (size_t) num_elements,
                                   GetNCCLDataType(first_entry.tensor), ncclSum,
                                   *nccl_op_context_.nccl_comm_, *gpu_op_context_.stream),
                            *nccl_op_context_.nccl_comm_);
  if (global_state_->timeline.Initialized()) {
    gpu_context_->RecordEvent(gpu_op_context_.event_queue, NCCL_ALLREDUCE, *gpu_op_context_.stream);
  }


  nccl_context_->ErrorCheck("ncclBcast",
                            ncclBcast(buffer_data,
                                      (size_t) num_elements,
                                      GetNCCLDataType(first_entry.tensor), root_rank,
                                      *nccl_op_context_.nccl_comm_, *gpu_op_context_.stream),
                            *nccl_op_context_.nccl_comm_);
  if (global_state_->timeline.Initialized()) {
    gpu_context_->RecordEvent(gpu_op_context_.event_queue, NCCL_BCAST, *gpu_op_context_.stream);
  }
  

  if (response.postscale_factor() != 1.0) {
    // Execute postscaling op
    ScaleBuffer(response.postscale_factor(), entries, buffer_data, buffer_data, num_elements);
  }

  // Copy memory out of the fusion buffer.
  if (entries.size() > 1) {
    MemcpyOutFusionBuffer(buffer_data, entries);

    if (global_state_->timeline.Initialized()) {
      gpu_context_->RecordEvent(gpu_op_context_.event_queue, MEMCPY_OUT_FUSION_BUFFER, *gpu_op_context_.stream);
    }
  }

  return gpu_op_context_.FinalizeGPUQueue(entries, true, nccl_op_context_.error_check_callback_);
}
```

### 2 Define CustomOp with A Different Name

1. Navigate to `nccl_operations.h`
2. Inherit from `NCCLAllreduce` and define a custom operator such as `CustomNCCLHierarchicalAllreduce` and define the public function name as same
```cpp=
#if HAVE_MPI
class CustomNCCLHierarchicalAllreduce : public NCCLAllreduce {
public:
  CustomNCCLHierarchicalAllreduce(NCCLContext* nccl_context, MPIContext* mpi_context,
                            GPUContext* gpu_context,
                            HorovodGlobalState* global_state)
      : NCCLAllreduce(nccl_context, gpu_context, global_state, Communicator::LOCAL),
        mpi_context_(mpi_context){};

  Status Execute(std::vector<TensorTableEntry>& entries,
                 const Response& response) override;

  bool Enabled(const ParameterManager& param_manager,
               const std::vector<TensorTableEntry>& entries,
               const Response& response) const override;

private:
  MPIContext* mpi_context_;
};
#endif
```
3. Write the implementation of the custom defined operation in `nccl_operations.cc` with both `Execute` and `Enabled` member function
```cpp
#if HAVE_MPI
Status
CustomNCCLHierarchicalAllreduce::Execute(std::vector<TensorTableEntry>& entries,
                                   const Response& response) {
  auto& first_entry = entries[0];

  // Determine GPU IDs of the devices participating in this communicator.
  std::vector<int32_t> nccl_device_map;
  nccl_device_map.reserve(
      global_state_->controller->GetLocalCommRanks().size());
  for (int rank : global_state_->controller->GetLocalCommRanks()) {
    nccl_device_map.push_back(response.devices()[rank]);
  }

  gpu_op_context_.InitGPU(entries);
  nccl_op_context_.InitNCCLComm(entries, nccl_device_map);
  gpu_op_context_.InitGPUQueue(entries, response);

  const void* fused_input_data;
  void* buffer_data;
  size_t buffer_len;

  // Copy memory into the fusion buffer.
  if (entries.size() > 1) {
    MemcpyInFusionBuffer(entries, fused_input_data, buffer_data, buffer_len);

    if (global_state_->timeline.Initialized()) {
      gpu_context_->RecordEvent(gpu_op_context_.event_queue, MEMCPY_IN_FUSION_BUFFER, *gpu_op_context_.stream);
    }
  } else {
    fused_input_data = first_entry.tensor->data();
    buffer_data = (void*) first_entry.output->data();
    buffer_len = (size_t) first_entry.output->size();
  }

  int64_t num_elements = buffer_len / DataType_Size(first_entry.tensor->dtype());

  if (response.prescale_factor() != 1.0) {
    // Execute prescaling op
    ScaleBuffer(response.prescale_factor(), entries, fused_input_data, buffer_data, num_elements);
    fused_input_data = buffer_data; // for unfused, scale is done out of place
  }

  // Do allreduce.
  int element_size = mpi_context_->GetMPITypeSize(first_entry.tensor->dtype());
  int local_size = global_state_->controller->GetLocalSize();
  int local_rank = global_state_->controller->GetLocalRank();

  // If cluster is homogeneous and we are using fusion buffer, include
  // dummy elements from the buffer (if necessary) to make sure the data
  // is divisible by local_size. This is always possible since we
  // set the fusion buffer size divisible by local_size.
  if (global_state_->controller->IsHomogeneous() && entries.size() > 1) {
    // Making sure the number of elements is divisible by
    // FUSION_BUFFER_ATOMIC_UNIT for improved performance
    int div = local_size * FUSION_BUFFER_ATOMIC_UNIT;
    num_elements = ((num_elements + div - 1) / div) * div;
    buffer_len = num_elements * element_size;
  }

 

  int root_rank =
      global_state_->controller->IsHomogeneous() ? local_size - 1 : 0;

  auto& timeline = global_state_->timeline;



  auto nccl_result = ncclReduce(fused_input_data,
                                buffer_data,
                                (size_t) num_elements,
                                GetNCCLDataType(first_entry.tensor), ncclSum,
                                root_rank, *nccl_op_context_.nccl_comm_, *gpu_op_context_.stream);
  nccl_context_->ErrorCheck("ncclReduce", nccl_result, *nccl_op_context_.nccl_comm_);
  if (global_state_->timeline.Initialized()) {
    gpu_context_->RecordEvent(gpu_op_context_.event_queue, NCCL_REDUCE, *gpu_op_context_.stream);
  }

  nccl_context_->ErrorCheck("ncclAllReduce", 
                            ncclAllReduce(fused_input_data, buffer_data,
                                   (size_t) num_elements,
                                   GetNCCLDataType(first_entry.tensor), ncclSum,
                                   *nccl_op_context_.nccl_comm_, *gpu_op_context_.stream),
                            *nccl_op_context_.nccl_comm_);
  if (global_state_->timeline.Initialized()) {
    gpu_context_->RecordEvent(gpu_op_context_.event_queue, NCCL_ALLREDUCE, *gpu_op_context_.stream);
  }


  nccl_context_->ErrorCheck("ncclBcast",
                            ncclBcast(buffer_data,
                                      (size_t) num_elements,
                                      GetNCCLDataType(first_entry.tensor), root_rank,
                                      *nccl_op_context_.nccl_comm_, *gpu_op_context_.stream),
                            *nccl_op_context_.nccl_comm_);
  if (global_state_->timeline.Initialized()) {
    gpu_context_->RecordEvent(gpu_op_context_.event_queue, NCCL_BCAST, *gpu_op_context_.stream);
  }
  

  if (response.postscale_factor() != 1.0) {
    // Execute postscaling op
    ScaleBuffer(response.postscale_factor(), entries, buffer_data, buffer_data, num_elements);
  }

  // Copy memory out of the fusion buffer.
  if (entries.size() > 1) {
    MemcpyOutFusionBuffer(buffer_data, entries);

    if (global_state_->timeline.Initialized()) {
      gpu_context_->RecordEvent(gpu_op_context_.event_queue, MEMCPY_OUT_FUSION_BUFFER, *gpu_op_context_.stream);
    }
  }

  return gpu_op_context_.FinalizeGPUQueue(entries, true, nccl_op_context_.error_check_callback_);
}

bool CustomNCCLHierarchicalAllreduce::Enabled(const ParameterManager& param_manager,
                                        const std::vector<TensorTableEntry>& entries,
                                        const Response& response) const {
  if (!NCCLAllreduce::Enabled(param_manager, entries, response)) {
    return false;
  }
  return param_manager.CustomHierarchicalAllreduce();
}
#endif
```
4. Navigate to `paramter_manager.h` and `parameter_mangager.cc` and add/modify the corresponding `CustomHierarchicalAllreduce` function including
    * `bool HierarchicalAllreduce() const;``
    * `void SetHierarchicalAllreduce(bool value, bool fixed=false);`
    * `Parameter::ParameterManager()`
    * `bool ParameterManger::CustomHierarchicalAllreduce(...)`
    * `void ParameterManager::SetHierarchicalAllreduce(...)`
    * `ParameterManager::Params ParameterManager::GetParams()`
    * `void ParameterManager::SetParams(const Params& newParams)`
    * `void ParameterManager::LogParameters(double score)`
    * ...
    
5. Navigate to `operations.cc`. Since the `CustomNCCLHierarchicalAllreduce` is triggered at runtime, the order for `CustomNCCLHierarchicalAllreduce` should be higher than `NCCLHierarchicalAllreduce` such as
```cpp=
#elif HAVE_NCCL && HOROVOD_GPU_ALLREDUCE == 'N'
    adasum_ops.push_back(std::shared_ptr<AllreduceOp>(new AdasumGpuAllreduceOp(&mpi_context, &nccl_context, &gpu_context, &state)));

    allreduce_ops.push_back(
        std::shared_ptr<AllreduceOp>(new NCCLHierarchicalAllreduce(
            &nccl_context, &mpi_context, &gpu_context, &state)));
            
    allreduce_ops.push_back(
        std::shared_ptr<AllreduceOp>(new CustomNCCLHierarchicalAllreduce(
            &nccl_context, &mpi_context, &gpu_context, &state)));
```
Also need to set flag for custom hierarchical allreduce.
6. After configuring C++ code, we can configure the Python `runner`
7. At line 41 of `horovod/horovod/runner/__init__.py` add
```python=
    self.custom_hierarchical_allreduce = None
```
8. At line 328 of `horovod/horovod/runner/lauch.py` add
```python=
    group_hierarchical_allreduce.add_argument('--custom-hierarchical-allreduce',
                                              action=make_override_true_action(override_args),
                                              help='Perform custom hierarchical allreduce between workers instead of '
                                                   'ring allreduce. Hierarchical allreduce performs a local '
                                                   'allreduce / gather within a host, then a parallel cross allreduce '
                                                   'between equal local ranks across workers, and finally a '
                                                   'local gather.')
```
9. At line 23 of `horovod/horovod/runner/common/util/config_parser.py` add
```python=
CUSTOM_HOROVOD_HIERARCHICAL_ALLREDUCE = 'CUSTOM_HOROVOD_HIERARCHICAL_ALLREDUCE'
```
line 87
```python=
        _set_arg_from_config(args, 'custom_hierarchical_allreduce', override_args, params)
```
line 187
```python=
    _add_arg_to_env(env, CUSTOM_HOROVOD_HIERARCHICAL_ALLREDUCE, args.custom_hierarchical_allreduce, identity)
```
10. For running custom hierarchical allreduce operation, use one of the following commands:
    * `$ NCCL_DEBUG=INFO horovodrun -np 2 --custom-hierarchical-allreduce python train.py`
    * `$ mpirun -np 2 -H server1:1, server2:1 -x NCCL_DEBUG=INFO -x CUSTOM_HIERARCHIL_ALLREDUCE=1 python train.py`

*Note: If there are problems relating to the environment, try to set the following environment variables `HOROVOD_NCCL_HOME=<path_to_nccl>`, `PATH=$PATH:<path_to_openmpi>`,`LD_LIBRARY_PATH=$LD_LIBRARY_PATH:<path_to_nccl>`*
*Note2: Add a timeline to record the events is also recommended, set `--timeline-filename=<path_to_timeline_file>` for `horovodrun` or `-x HOROVOD_TIMELINE=<path_to_timeline_file>` for `mpirun`*

## Compilation

To compile the new custom operator, execute the following (coupled with Pytorch for example):

```bash=
$ rm -rf build/ dist/
$ pip uninstall -y horovod
$ HOROVOD_NCCL_HOME=<path_to_nccl> HOROVOD_GPU_OPERATIONS=NCCL HOROVOD_WITH_PYTORCH=1 HOROVOD_WITHOUT_TENSORFLOW=1 HOROVOD_WITHOUT_MXNET=1 python setup.py install
```
*Note: for multiple open-mpi/nccl versions installed, try setting `export PATH=$PATH:<path_to_openmpi>` and `export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:<path_to_nccl>`*