---
layout: post
title: "Use SM2/SM3 in Hyperledger Fabric 1.4"
date: 2019-02-13 02:24:24
categories: note
tags: fabric encryption cryptography gmssl
---

To understand why we want to change the default encryption method, we need to have a basic understanding of **openssl**, **gmssl** & **bccsp**.

# Background

## OPENSSL

*[official page for `openssl`](https://www.openssl.org/)*

### How to check the certificate

```
openssl x509 -in <> -inform pem -noout -text
```

### Lexicons in OPENSSL

* `.csr` (Certificate Signing Request) - a block of encoded text that is given to a Certificate Authority when applying for an SSL Certificate
* `.der`
* `.key`
* `.p12`
* `.pfx`

## GMSSL

*[official page for `gmssl`](http://gmssl.org/)*


### How to check the certificate

```
gmssl x509 -in <> -inform pem -noout -text
```

## BCCSP

*The interface of bccsp can be found [there](https://github.com/hyperledger/fabric/blob/release-1.4/bccsp/bccsp.go#L98-L144)*

```go
type BCCSP interface {

	// KeyGen generates a key using opts.
	KeyGen(opts KeyGenOpts) (k Key, err error)

	// KeyDeriv derives a key from k using opts.
	// The opts argument should be appropriate for the primitive used.
	KeyDeriv(k Key, opts KeyDerivOpts) (dk Key, err error)

	// KeyImport imports a key from its raw representation using opts.
	// The opts argument should be appropriate for the primitive used.
	KeyImport(raw interface{}, opts KeyImportOpts) (k Key, err error)

	// GetKey returns the key this CSP associates to
	// the Subject Key Identifier ski.
	GetKey(ski []byte) (k Key, err error)

	// Hash hashes messages msg using options opts.
	// If opts is nil, the default hash function will be used.
	Hash(msg []byte, opts HashOpts) (hash []byte, err error)

	// GetHash returns and instance of hash.Hash using options opts.
	// If opts is nil, the default hash function will be returned.
	GetHash(opts HashOpts) (h hash.Hash, err error)

	// Sign signs digest using key k.
	// The opts argument should be appropriate for the algorithm used.
	//
	// Note that when a signature of a hash of a larger message is needed,
	// the caller is responsible for hashing the larger message and passing
	// the hash (as digest).
	Sign(k Key, digest []byte, opts SignerOpts) (signature []byte, err error)

	// Verify verifies signature against key k and digest
	// The opts argument should be appropriate for the algorithm used.
	Verify(k Key, signature, digest []byte, opts SignerOpts) (valid bool, err error)

	// Encrypt encrypts plaintext using key k.
	// The opts argument should be appropriate for the algorithm used.
	Encrypt(k Key, plaintext []byte, opts EncrypterOpts) (ciphertext []byte, err error)

	// Decrypt decrypts ciphertext using key k.
	// The opts argument should be appropriate for the algorithm used.
	Decrypt(k Key, ciphertext []byte, opts DecrypterOpts) (plaintext []byte, err error)
}
```

### Lexicon for BCCSP

* `ski`: subject key identifier
* `csp`: cryptographic service provider
* `hsm`: Hardware security module - a physical computing device that safeguards and manages digital keys for strong authentication and provides crypto processing<sup>1</sup>
* `X.509` - a standard defining the format of public key certificates<sup>2</sup> (This is also used in MSP/Membership Service Provider)
* `public key certificate`/`digital certificate`/`identity certificate` - an electronic document used to provde the ownership of a public key<sup>3</sup>
* `public key cryptography` <sup>4</sup> - a cryptographic system that uses pairs of keys: *public keys* which may be disseminated widely, and private keys which are known only to the owner<sup>5</sup>.
* `PKI`: Public-key infrastructure
* `ecdsa`: Elliptic Curve Digital Signature Algorithm - 

# Steps to add sm2/sm3 support for Fabric

1. Clone the Hyperledger/fabric under `GOPATH`

For example,
```
mkdir -p ~/gopath/src/github.com/hyperledger/fabric
cd ~/gopath/src/github.com/hyperledger/fabric

# OPTIONAL, if not exist
git init
git remote add origin git@github.com:hyperledger/fabric.git
git fetch --all
git checkout release-1.4.0
# END OPTIONAL
```

![](/assets/images/sm_convertion/git_checkout.png)


2. apply the patch

```
git clone git@github.com:flyinox/fabric-sm-patch.git
git am fabric-sm-patch/fabric-sm-patch
```

Make sure the HEAD is correct,
![](/assets/images/sm_convertion/git_log_head.png)

3. compile to executable

Note: You can also check the target compiling file by `go list -f '{{.GoFiles}}'` under `common/tools/cryptogen`
![](/assets/images/sm_convertion/check_target.png)

But you can also build the file directly by,
```
# under <FABRIC>/common/tools/cryptogen
go build mainsm.go
```


```
make native
```
![](/assets/images/sm_convertion/make_native.png)


5. generate *crypto-config*

```
# USE cryptogen to generate certificates with sm2/sm3 signature
.build/bin/cryptogen generate --help
```

You should see the following message,
![](/assets/images/sm_convertion/generate_help.png)



An example certificate for orderer,
![](/assets/images/sm_convertion/ex_cert_orderer.png)

Or Admin,
![](/assets/images/sm_convertion/cert_admin.png)

Or MSP CA,
![](/assets/images/sm_convertion/cert_msp_ca.png)


However, for **tlsca** the signature algorithm is NOT modified,
![](/assets/images/sm_convertion/cert_tls.png)



--- 

1. [Wiki of `hsm`](https://en.wikipedia.org/wiki/Hardware_security_module)
2. [Wiki of `x509`](https://en.wikipedia.org/wiki/X.509)
3. [Wiki of `public key certificate`](https://en.wikipedia.org/wiki/Public_key_certificate)
4. [Wiki of `key authentication`](https://en.wikipedia.org/wiki/Key_authentication)
4. [Wiki of `public-key cryptography`](https://en.wikipedia.org/wiki/Public-key_cryptography)