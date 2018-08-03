---
layout: post
title: "Introduction to ENE"
date: 2018-08-02 18:40:31
categories: cryptograph toolkit
tags: cryptograph
---

# **E**ncrypt o**n** **E**mail
*You can find the Chiense version of this introduction [there](https://quininer.github.io/?ene) and Rust implementation on [Github](https://github.com/quininer/ene)*

What is ENE?
------------

ENE is an experimental, designed for mail, end-to-end encryption tool. It basically is what I conceive as OpenPGP 2.0 with several improvements with regard to the weakness of PGP.

Mail is a one-pass, stateless commutation scheme, which means designing encryption scheme for it does not meet many common security requirements such as Perfect Forward Secrecy. In fact, neglecting any one limitation, we can do much more. For example, OpenPGP has Forward Secrecy scheme in stateful situations<sup>1</sup>.

But under these conditions, what we can do is much less.

In the early days, we are satisfied with simple <ruby>KEM<rt>Key encapsulation mechanisms</rt></ruby> + Encrypt scheme while those schemes lack authentication and integrity.

However, in 2018, we can do better.

ENE will support:

* Authenticated Key Exchange
* Deniable Authentication
* Mail Integrity
* Nonce-misuse Resistant AEAD
* Experimental Post-quantum Cipher suite

We need Authentication?
---

Considering a scenario, where Alice sends Bob an encrypted message without authentication. Mallory could easily intercept and forward the message to Bob. And Bob will think the message is sent from Mallory.

This is caused by the absence of identity authentication.

Some people might think simply adding a signature solves all the problems. But it does not. The simple signature scheme has two weaknesses,

1. The loss of Deniability<sup>2</sup>
    * When you sign the message with your private key, you have certain responsibilities. You cannot deny the message is from you.

2. Surreptitious Forwarding Attack<sup>3,4</sup>
    * Mallory can separate the signature of Alice, use his own signature instead.
    * Some people might think Sign-then-Encrypt could solve this problem. But if the encryption scheme does not reach CCA<sup>5</sup>, then it still cannot prevent such attacks.

ENE has four authentication schemes, a user can choose the security level freely to meet their goals.

1. One-Pass Authenticated Key Exchange<sup>6,7</sup>
    * One-pass AKE has good performance because it does not involve complicated signature algorithm.
    * Since the message is only passed once, we cannot reach perfect forward secrecy. But we can Sender Forward Secrecy, this is at least as good as public key encryption.
    * One-pass AKE only provides implicit authentication, which means it cannot resist <ruby>KCI<rt>Key Compromise Impersonation</rt></ruby> attack<sup>8</sup>.
    * One-pass AKE is the weakest authentication methods in ENE, but it can still defense most attacks. (You should use it to replace the unauthentication methods in early mail encryption).

2. Signature-based Authenticated Key Exchange<sup>9,10</sup>
    * Adding signature to key exchange can make explicit authentication. This improvement can defense KCI attack.
    * The content of signature does not include message, this means it can keep the deniability of the message.


3. Signature Key Exchange and Message
    * Based on the 2nd method, the content of signature includes plaintext. This will keep the Non-Repudiation of the message.

4. Signature Only
    * Sign only the plaintext, without any encryption.


We need AEAD?
---

I don't think I need to repeat telling the importance of identity authentication in year 8102.

[EFAIL](https://efail.de/) is an example of poor integrity verification.

In fact, OpenPGP has its integrity verification scheme MDC<sup>11</sup>, but in many applications it serves only as warnings, and there is SEIP downgrade attack<sup>12</sup>. While in ENE, we use a more state-of-the-art method AEAD to keep integrity verified.

The research for AEAD has been conducted for many years<sup>13</sup>. More security properties have been proposed such as Nonce-misuse Resistant<sup>14</sup>.

Due to the stateless property of mails, we could only generate nonce randomly. For some encryption algorithms, the effect of nonce reuse is devastating such as AES-GCM <sup>15</sup>.
Although we may do not have enough amount of emails to start a birthday attack, using an AEAD of Nonce-misuse Resistant can make us immune to this problem.



We need Post-quantum?
---

A well-known fact is that quantum computer can break all popular public key algorithms. All emails encrypted with RSA/ECC will not be able to keep secrecy. Thus, it is necessary to prevent such scenario before the emergency of practical quantum computers.

There are generally two ways to defend against quantum adversary.

1. Use Pre-Shared Key
2. Use Post-quantum key exchange<sup>16</sup>

Considering the use case for mails, it is not practical to use pre-shared key. Therefore, using Post-quantum algorithm is a better choice.


Is ENE Perfect?
----

No!

This is always space for improvements:

* Subkey support
* Full Forward Secrecy<sup>17,18</sup>
* <ruby>Group<rt>Mailing List</rt></ruby> Encryption Support
* Denfense against Side-Channel attack
* Protocol Formal Verification

ENE is a very young tool, all shall change in the future.


Why not use ENE?
---

ENE is not elixir. It is designed for mail encryption, not full replacement of PGP.

1. Web of Trust<sup>19</sup>
    * I am not going to discuss the pros and cons of Web of Trust.
    * ENE is not a trust system, it does not consider how to build trust relations.
    * If needed, you can use PGP to sign ENE public key.
2. Sign for git commit, packages and other public keys
    * You can use ENE to do it, but it does not have many advantages over PGP.
    * Of course, you can also use [pbp](https://boats.gitlab.io/blog/post/signing-commits-without-gpg/).
3. Encrypt large file
    * The context of mail is normally not too big, ENE thus does not consider this.
    * However, this does not mean GPG is suitable for file encryption.  4. Need reliable, stable encryption methods
    * ENE is not stable! It might change at anytime.
    * The "modern PGP" is still one of the best choices, such as [Sequoia](https://sequoia-pgp.org/).


-----

1. [Forward Secrecy Extensions for OpenPGP](https://tools.ietf.org/html/draft-brown-pgp-pfs-03)
2. [Deniable authentication](https://en.wikipedia.org/wiki/Deniable_authentication)
3. [Should we sign-then-encrypt, or encrypt-then-sign?](https://crypto.stackexchange.com/questions/5458/should-we-sign-then-encrypt-or-encrypt-then-sign)
4. [Defective Sign & Encrypt in S/MIME, PKCS#7, MOSS, PEM, PGP, and XML](http://world.std.com/~dtd/sign_encrypt/sign_encrypt7.html)
5. [Chosen-ciphertext attack](https://en.wikipedia.org/wiki/Chosen-ciphertext_attack)
6. [One-Pass HMQV and Asymmetric Key-Wrapping](https://eprint.iacr.org/2010/638.pdf)
7. [OAKE: a new family of implicitly authenticated diffie-hellman protocols](https://dl.acm.org/citation.cfm?id=2508859.2516695)
8. [Key Compromise Impersonation attacks (KCI)](https://www.cryptologie.net/article/372/key-compromise-impersonation-attacks-kci/)
9. [The SIGMA Family of Key-Exchange Protocols](http://webee.technion.ac.il/~hugo/sigma.html)
10. [AEAD variant of the SIGMA-I protocol](https://tools.ietf.org/id/draft-selander-ace-cose-ecdhe-08.html#protocol)
11. [Modification Detection Code Packet](https://tools.ietf.org/html/rfc4880#page-52)
12. [OpenPGP SEIP downgrade attack](https://www.ietf.org/mail-archive/web/openpgp/current/msg08285.html<Paste>)
13. [Authenticated encryption](https://en.wikipedia.org/wiki/Authenticated_encryption)
14. [Nonce misuse resistance 101](https://www.lvh.io/posts/nonce-misuse-resistance-101.html)
15. [Nonce-Disrespecting Adversaries: Practical Forgery Attacks on GCM in TLS](https://eprint.iacr.org/2016/475.pdf)
16. [Post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography)
17. [Forward Secure Asynchronous Messaging from Puncturable Encryption](http://cs.jhu.edu/~imiers/pdfs/forwardsec.pdf)
18. [0-RTT Key Exchange with Full Forward Secrecy](https://eprint.iacr.org/2017/223.pdf)
19. [Web of trust](https://en.wikipedia.org/wiki/Web_of_trust)
