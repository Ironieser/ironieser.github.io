---
title: "NeurIPS'26 | LoHi: Rethinking Long-Video Efficiency with Low-Res Video + High-Res Images"
date: "2026-10-03"
description: "My NeurIPS 2026 work on efficient long-video understanding. Instead of asking which tokens to keep at native resolution, we ask how to spend a fixed budget across frame count, per-frame resolution, and front-end decoding latency. Three lessons lead to LoHi: a training-free, single-pass framework that decodes half the frames, has the lowest latency, and gets the highest accuracy."
tags: ["Video Understanding", "Vision-Language Models", "Efficient Inference", "Long Video", "NeurIPS 2026"]
image: "images/blog/lohi/framework.jpg"
---

# NeurIPS'26 | LoHi: Rethinking Long-Video Efficiency with Low-Res Video + High-Res Images

> _Sharing my new work here — hope you'll bear with any shortcomings, and welcome any suggestions, comments, or critiques! This is joint work with UCF, Meta Reality Labs and Axon. The question we started from sounds simple: **for a long video and a fixed visual-token budget, how should we actually spend those tokens?** The answer turned out to be less about which tokens to keep, and more about frames, pixels, and the video decoder that nobody measures._

**Paper:** [Rethinking Long-Video Efficiency: A Joint Allocation Perspective on Frames, Pixels, and Front-End Latency](https://arxiv.org/abs/2610.04318) (arXiv:2610.04318, NeurIPS 2026)  
**Code:** [github.com/Ironieser/LongVideo-Eval](https://github.com/Ironieser/LongVideo-Eval) (release in progress) — LoHi is released through **[LongVideo-Eval](https://sixundong.com/projects/longvideo-eval)**, a system-aware, complete-cost evaluation harness for long-video intelligence  
**Project Page:** [sixundong.com/projects/lohi](https://sixundong.com/projects/lohi) _(with three small interactive toys, one per lesson (・ω・))_

---

## TL;DR

We revisit long-video VLM efficiency as a **joint allocation problem** over frame count, per-frame resolution, and front-end decoding latency.

**Three lessons:** (i) dense low-resolution sampling beats sparse native-resolution sampling at the same token budget; (ii) some tasks (OCR, attributes) really need resolution; (iii) on hour-long videos, the video decoder, not the VLM, dominates wall time.

**Method:** **LoHi** = a dense **Lo**w-resolution video stream (Lo-V) + a sparse set of **Hi**gh-resolution images (Hi-I), fed through the VLM's own video and image pathways. Training-free, single forward pass, no architecture change.

**Results:** On VideoMME / MLVU / LVBench with Qwen3-VL-4B, LoHi improves over the default 16-frame native-resolution recipe by **+10.6%** on average at the same token budget, and over the strongest prior efficiency method by **+5.2%**, while decoding only **128 frames instead of 256** and reducing front-end decoding latency by up to **7×** on hour-scale clips.

> **In one sentence:** Trade pixels for frames — half the decoding, lower latency, higher accuracy. Just stop insisting on native resolution (・ω・)

---

## Core Takeaways

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin: 2rem 0;">
  <div style="background: #edf1f5; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2e6e9e;">
    <h4 style="margin-top: 0; color: #2e6e9e;">🎞️ Lesson 1: Dense low-res is the new recipe</h4>
    <p style="margin-bottom: 0;">At the same token budget, 256 frames at ¼ resolution beat 16 native frames — and beat dedicated keyframe-selection and token-pruning methods too.</p>
  </div>
  <div style="background: #edf1f5; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2e6e9e;">
    <h4 style="margin-top: 0; color: #2e6e9e;">🔍 Lesson 2: Resolution is task-dependent</h4>
    <p style="margin-bottom: 0;">Actions and scenes survive downscaling; OCR and attributes don't. No single (frames, resolution) setting serves every question.</p>
  </div>
  <div style="background: #edf1f5; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2e6e9e;">
    <h4 style="margin-top: 0; color: #2e6e9e;">⏱️ Lesson 3: The decoder is the bottleneck</h4>
    <p style="margin-bottom: 0;">Decode-then-select pipelines decode the whole video first. On a 60-min clip that is 53 s of decoding versus 7 s for uniform sampling.</p>
  </div>
  <div style="background: #fbeae8; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #d2382c;">
    <h4 style="margin-top: 0; color: #d2382c;">✏️ LoHi: Lo-V + Hi-I</h4>
    <p style="margin-bottom: 0;">Decode 128 frames once, send all of them at low resolution, and a few of them again at native resolution. Half the decoding, the lowest TTFT, the best accuracy.</p>
  </div>
</div>

---

## 1. Core Motivation

Long-video understanding is where VLMs are heading: the evidence for a question can be anywhere in an hour of video, and the decisive cue can be tiny (a number on a scoreboard) or fleeting (two seconds of an action).

Every VLM has a visual-token budget. Under that budget, there are two ways to spend tokens:

- **More frames** → better temporal coverage;
- **Higher per-frame resolution** → better spatial detail.

The current efficient long-video methods mostly treat this as an **informative token selection** problem at **fixed native resolution**:

1. **Keyframe selection** (AKS, BOLT, CLIP top-K): score candidate frames and keep the best 16;
2. **Token pruning** (VisionZip, FlashVid, and yes, my own MMTok): encode everything, then drop most tokens.

**But this framing leaves two axes unused:**

- **Per-frame resolution** can be traded for temporal coverage — lowering resolution frees budget for more frames — yet resolution stays at native scale by default;
- **Front-end latency**, i.e., the time spent decoding and preprocessing frames before they reach the VLM, grows with video length and can exceed VLM inference itself, yet is rarely reported.

**So the question is:** not *which informative tokens to keep*, but *how to jointly allocate an end-to-end budget across frame count, per-frame resolution, and front-end latency*?

---

## 2. Three Lessons

Formally, a VLM spends a token budget *B* on one configuration *(N, r)*: *N* frames at resolution scale *r* (relative to native, *r* = 1), with *N · τ(r) ≤ B*, where *τ(r)* is tokens per frame. Since *τ(r)* scales with *r²*, halving the resolution buys you 4× more frames.

<figure style="text-align: center; margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 1000px; margin: 0 auto;">
    <img src="images/blog/lohi/fig1a.png" alt="A new simple recipe" style="width: 100%; height: auto;">
    <img src="images/blog/lohi/fig1b.png" alt="Resolution sensitivity" style="width: 100%; height: auto;">
    <img src="images/blog/lohi/fig1c.png" alt="The overlooked decode latency" style="width: 100%; height: auto;">
  </div>
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 1: Three practical lessons. (a) At matched token budgets, dense low-resolution sampling substantially outperforms the default baseline. (b) Resolution-sensitive tasks (OCR, Attribute Perception) drop under aggressive downscaling; Action Recognition and Temporal Reasoning remain robust. (c) Decode-then-select (D) latency scales with video length, while uniform fixed-budget sampling (U) stays almost constant.</figcaption>
</figure>

### Lesson 1: Dense, low-resolution sampling is the new recipe

We compare three allocations under the same ~5,760-token budget: (16, 1.0), (64, 0.5) and (256, 0.25).

| Setting | Qwen3-VL-4B VideoMME | MLVU | LVBench | Qwen3-VL-8B VideoMME | MLVU | LVBench |
|---|---|---|---|---|---|---|
| 16F&#64;1.0 (default) | 57.78 | 58.89 | 38.61 | 60.04 | 58.95 | 38.22 |
| 64F&#64;0.5 | 62.30 | 65.40 | 40.93 | 65.96 | 66.41 | 41.83 |
| **256F&#64;0.25** | **64.44** | **69.36** | **43.71** | **67.04** | **71.29** | **44.80** |

For Qwen3-VL-4B, (256, 0.25) improves over the default by **+6.66** on VideoMME, **+10.47** on MLVU and **+5.10** on LVBench. The gains are largest when the default recipe badly under-samples the timeline: 16 frames of a one-hour video is one frame every ~4 minutes!

We call (256, 0.25) **Low-Res-Base**. Spoiler: it has no selection logic at all, and it already beats every keyframe-selection and token-pruning baseline on average (Section 4).

> **In one sentence:** Under a strict token budget, coverage beats per-frame detail. Dense low-resolution sampling should be the new baseline for long-video VLMs.

### Lesson 2: Resolution sensitivity is task-dependent

But Low-Res-Base is not free. If you downscale a frame by 4× in each dimension, people, actions and scene layout are still perfectly recognizable — for you and for the VLM. Small text and fine attributes are not.

On VideoMME, going from *r* = 1.0 to *r* = 0.25 drops **Attribute Perception by 9.9** and **OCR by 10.1**, while Action Recognition and Temporal Reasoning barely move (Figure 1b).

We take OCR and Attribute as the resolution-sensitive subset (**R**) and the rest as **¬R**. At the same budget, the winner flips:

<figure style="text-align: center; margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; max-width: 760px; margin: 0 auto;">
    <img src="images/blog/lohi/fig2b.png" alt="Frame-resolution allocation" style="width: 100%; height: auto;">
    <img src="images/blog/lohi/fig2a.png" alt="Frame density monotone gain" style="width: 100%; height: auto;">
  </div>
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 2: Left — under a matched budget, resolution-sensitive questions favor 64F&#64;0.5, everything else favors 256F&#64;0.25. Right — at fixed r = 0.25, accuracy rises monotonically with frame count from 16 to 256.</figcaption>
</figure>

**So no single (N, r) pair can satisfy both subsets.** Any globally fixed allocation is suboptimal somewhere. This is exactly the gap a few high-resolution frames should fill.

> **In one sentence:** Most questions want coverage, a few want detail — so give them both.

### Lesson 3: Front-end latency cannot be overlooked

This is the lesson I personally find most underrated. A video file is **not a stack of pictures**.

Video codecs organize frames into **Groups of Pictures (GoPs)**:

- An **I-frame** is a complete, self-contained image at the start of each GoP (often at a scene change or big motion);
- A **P-frame** only stores *what changed* relative to the previous frame.

So to get one P-frame, the decoder must start from the I-frame and replay every frame in between. Roughly:

<p style="text-align:center;font-size:1.15em;"><em>T<sub>dec</sub> ≈ G · t<sub>I</sub> + (Σ<sub>k</sub> d<sub>k</sub>) · t<sub>P</sub></em></p>

where *G* is the number of GoPs touched, *d<sub>k</sub>* is the in-GoP depth of each sampled frame, and *t<sub>I</sub>*, *t<sub>P</sub>* are the per-frame decode costs of I- and P-frames.

Dense sampling (e.g., FPS = 1, which keyframe methods use to build their candidate pool) touches every GoP and grows linearly with duration. Uniform sampling of a fixed *N* caps both terms:

| Video length | Sampling | GoP seeks | Decoded frames | Decode latency |
|---|---|---|---|---|
| 10 min | Dense | 600 | ~18K | 8.5 s |
| | Uniform | 256 | ~15K | 4.7 s |
| 30 min | Dense | 1,800 | ~54K | 25.3 s |
| | Uniform | 256 | ~27K | 6.5 s |
| 60 min | Dense | 3,600 | ~108K | **53.3 s** |
| | Uniform | 256 | ~27K | **7.2 s** |
| VideoMME | Dense | ~272 | ~24K | 14.6 s |
| | Uniform | ~136 | ~9K | 3.9 s |

On a one-hour clip, the gap is **7.4×**, and the decoder runs for almost a minute while the GPU sits idle. This is precisely the cost paid by decode-then-select keyframe methods, and it is almost never reported.

> **In one sentence:** Efficiency methods must bound the size of the decoded candidate pool, not just the number of tokens passed to the VLM.

---

## 3. Method: LoHi

### Cross-resolution decomposition

Put the three lessons together and the recipe almost writes itself: **start from dense low-resolution temporal coverage, then add only a small amount of high-resolution evidence, while keeping the decoded pool small.**

We split the single configuration *(N, r)* into two complementary streams that share one budget:

<p style="text-align:center;font-size:1.15em;"><em>N · τ(r<sub>ℓ</sub>) + K · τ(r<sub>h</sub>) ≤ B</em> &nbsp;(token budget, L1 + L2), &nbsp;&nbsp; <em>N<sub>dec</sub> = N</em> &nbsp;(decode budget, L3)</p>

- **Lo-V** (low-resolution video): *N* = 128 frames at *r<sub>ℓ</sub>* = 0.25 → temporal coverage (L1);
- **Hi-I** (high-resolution images): *K* = 8 frames at *r<sub>h</sub>* = 1.0 → spatial detail (L2);
- The *K* Hi-I indices are **a subset of the Lo-V grid**, so every frame is decoded **once** at native resolution and reused at both scales. Decode count depends only on *N*, not on video length (L3).

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/lohi/framework.jpg" alt="LoHi Framework" style="width: 95%; max-width: 1000px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 3: Overview of LoHi. Compared with previous work (A), which prunes or selects within a native-resolution pathway, LoHi (B) decomposes one decoded video into two complementary streams: dense low-resolution Lo-V via the video pathway and sparse high-resolution Hi-I via the image pathway. (C) The LoHi-SemDiv selector picks Hi-I indices via greedy MAP.</figcaption>
</figure>

### Two native pathways, one sentence of glue

Modern unified VLMs (e.g., the Qwen-VL series) already expose two input pathways that share the same vision tower:

- a **video pathway** with 3D temporal-spatial mRoPE, where every frame gets a globally consistent temporal position, so motion keeps its natural rate;
- an **image pathway**, where each image gets its own 2D positions.

LoHi routes Lo-V through the video pathway and Hi-I through the image pathway, so the high-resolution frames never disturb the video timeline. Then we simply tell the model how they relate:

> _[Video] The above low-resolution video provides temporal context. The following K high-resolution images show selected key frames: [img₁], …, [img_K]._

That's it. No fine-tuning, no new modules, no architectural change.

### Plug-and-play Hi-I selectors

Which *K* frames get the high-resolution treatment? We provide three selectors with different cost–accuracy trade-offs:

**✅ LoHi-Uniform**  
Pick *K* frames at regular intervals on the Lo-V grid. Pure indexing, zero cost. Surprisingly, this alone already delivers most of the gain.

**🎬 LoHi-Anchor (codec-guided)**  
Remember the I-frames from Lesson 3? Encoders tend to place them at abrupt scene changes or strong motion, so they are a **free semantic signal**. For each uniform position, Anchor finds the nearest I-frame from pre-computed indices and selects the Lo-V grid frame closest to it. No extra pixel decoding, no CLIP, no question parsing.

**🧩 LoHi-SemDiv (diversity-aware)**  
Inspired by the subset-selection view in MMTok, but with a twist: temporal coverage is already supplied by Lo-V, so the *K* Hi-I slots should be (i) **query-relevant** and (ii) **mutually diverse**. A quality–similarity determinantal point process (DPP) unifies both. With CLIP frame embeddings *e<sub>j</sub>* and a sharpened query relevance *q<sub>j</sub>*:

<p style="text-align:center;font-size:1.15em;"><em>L = diag(q) · E E<sup>⊤</sup> · diag(q)</em>, &nbsp;&nbsp; <em>S* = argmax<sub>|S| = K</sub> log det(L<sub>S</sub> + I)</em></p>

Diagonals encode relevance, off-diagonals penalize near-duplicate frames. The objective is monotone submodular, so greedy selection gives the classic (1 − 1/e) guarantee. Cost: one CLIP pass over 128 *small* frames.

### Bonus: Adaptive LoHi

Because the two streams are decoupled, LoHi can first answer from the cheap Lo-V base and trigger Hi-I only when the answer entropy is high. This nearly matches the full pipeline while invoking the high-resolution stream on only **one-third** of the queries.

---

## 4. Experimental Results

**Setup.** VideoMME (w/o subtitles), MLVU and LVBench. Main backbone Qwen3-VL-4B; we also test Qwen3-VL-8B, Qwen3.5-4B, Qwen2.5-VL-7B, VideoChat3-4B and VideoLLaMA3-7B. All methods cap decoding at 256 frames per video and share the token budget of the default (16, 1.0) recipe (~5,760 tokens). Keyframe baselines decode 256 frames at *r* = 1.0 and keep 16; token-pruning baselines decode 256 at *r* = 1.0 and prune 93.75% of tokens. LoHi uses 128F&#64;0.25 + 8 Hi-I, i.e., **half the decoded frames**.

### 4.1 Main Results

| Method | Decoded | Setting | VideoMME | MLVU | LVBench | Avg. |
|---|---|---|---|---|---|---|
| Qwen3-VL-4B | 16 | 16F&#64;1.0 | 57.78 | 58.89 | 38.61 | 51.76 |
| *Dense low-res* | | | | | | |
| Low-Res-Base | 256 | 256F&#64;0.25 | 64.44 | 69.36 | 43.71 | 59.17 |
| *Keyframe selection* | | | | | | |
| CLIP-TopK | 256 → 16 | 16F&#64;1.0 | 57.19 | 69.36 | 44.74 | 57.10 |
| AKS | 256 → 16 | 16F&#64;1.0 | 57.26 | 69.22 | 44.67 | 57.05 |
| BOLT | 256 → 16 | 16F&#64;1.0 | 60.81 | 68.11 | 42.48 | 57.13 |
| *Token pruning* | | | | | | |
| VisionZip | 256 | 256F&#64;1.0 | 57.00 | 62.46 | 35.13 | 51.53 |
| FlashVid | 256 | 256F&#64;1.0 | 59.30 | 63.70 | 34.09 | 52.36 |
| *LoHi (ours)* | | | | | | |
| LoHi-Uniform | 128 | 128F&#64;0.25 + Hi-I | 65.78 | 67.62 | 44.09 | 59.16 |
| LoHi-Anchor | 128 | 128F&#64;0.25 + Hi-I | 65.89 | 68.40 | 44.42 | 59.57 |
| **LoHi-SemDiv** | 128 | 128F&#64;0.25 + Hi-I | **66.81** | **74.38** | **45.90** | **62.36** |

**Some interesting results:**

- **Low-Res-Base**, with zero selection logic, already outperforms every keyframe-selection and token-pruning baseline on average (59.17 vs. at most 57.13);
- LoHi-SemDiv is the best on all three benchmarks: **+10.60** average over the vanilla recipe, **+5.23** over the strongest prior baseline (BOLT);
- SemDiv > Anchor > Uniform on every benchmark, with the biggest diversity contribution on MLVU (**+6.76** over Uniform);
- And LoHi decodes **only 128 frames**, half of everyone else.

### 4.2 End-to-End Efficiency

Accuracy is only half the story. We profile time-to-first-token (TTFT) on VideoMME, including CPU decoding:

| Method | Decode (s) | Select (ms) | ViT (ms) | TTFT (ms) | TFLOPs | VideoMME |
|---|---|---|---|---|---|---|
| 256F&#64;0.25 | 5.4 | 50 | 216 | 5,963 | 82.2 | 64.44 |
| Keyframe (AKS / BOLT / CLIP-TopK) | 5.4 | 130 | 151 | 5,978 | 89.3 | 60.81 |
| VisionZip | 5.4 | 4 | 2,486 | 8,186 | 464.3 | 57.00 |
| FlashVid | 5.4 | 808 | 2,486 | 8,990 | 464.3 | 59.30 |
| LoHi-Uniform / Anchor | **3.3** | 51 | **195** | **3,836** | 84.6 | 65.78 / 65.89 |
| LoHi-SemDiv | **3.3** | 120 | **195** | 3,906 | 85.8 | **66.81** |

- Decoding 128 instead of 256 frames immediately cuts front-end latency from **5.4 s to 3.3 s**;
- Token pruning hits a **vision-tower bottleneck** (464.3 TFLOPs, 2,486 ms of ViT) because it encodes native-resolution frames *before* pruning. LoHi cuts ViT latency by ~**12×**;
- Versus the dense low-res baseline, LoHi-SemDiv goes from 64.44% to **66.81%** while TTFT drops from 5,963 to **3,906 ms** — better *and* faster.

> **In one sentence:** Joint allocation improves accuracy and efficiency at the same time; you don't have to pick one.

### 4.3 Rethinking Token Pruning for Video VLMs

This one hurt a little, since I also work on token pruning (MMTok). We compared pruning methods against a **naive resize** at the same number of tokens reaching the LLM:

| Method | Setting | VideoMME | LVBench | MLVU | Avg. |
|---|---|---|---|---|---|
| Qwen3-VL-4B | 16F&#64;1.0 | 57.78 | 38.61 | 58.89 | 51.76 |
| *25% budget (~1,440 tokens)* | | | | | |
| VisionZip | 16F&#64;1.0 | 55.56 | 34.47 | 53.75 | 47.93 |
| MMTok | 16F&#64;1.0 | 55.19 | 34.80 | 54.82 | 48.27 |
| FlashVid | 16F&#64;1.0 | 55.11 | 35.44 | 54.54 | 48.36 |
| **Resize** | 16F&#64;0.5 | **56.26** | **35.51** | **57.95** | **49.91** |
| *50% budget (~2,880 tokens)* | | | | | |
| VisionZip | 128F&#64;1.0 | 54.44 | 35.51 | 58.99 | 49.65 |
| MMTok | 128F&#64;1.0 | 59.56 | 36.86 | 62.24 | 52.89 |
| FlashVid | 128F&#64;1.0 | 58.19 | 35.77 | 60.67 | 51.54 |
| **Resize** | 128F&#64;0.25 | **63.00** | **39.25** | **66.34** | **56.20** |

Simple resizing matches or beats every dedicated pruning method, and it is far cheaper: resizing downsamples frames up front, while pruning pays for native-resolution encoding and then throws tokens away.

**Why?** Pruning works great on static images, but in videos, discarding irregular patches across frames destroys **spatial continuity and temporal consistency**. For video, a complete lower-resolution global context matters more than fragmented high-resolution details.

### 4.4 Ablations

**Robust across K and selectors.** Four training-free selectors × K ∈ {2, 4, 8}:

| Selector | K=2 | K=4 | K=8 |
|---|---|---|---|
| LoHi-Uniform | 65.44 | 65.52 | 65.78 |
| LoHi-Anchor | 65.22 | 65.85 | 65.89 |
| LoHi-CLIP Top-K | 65.37 | 66.00 | 66.44 |
| **LoHi-SemDiv** | **65.59** | **66.22** | **66.81** |

All 12 configurations land in **65.22–66.81%**, above the 128-frame Lo-V-only baseline (63.00%). The gain is not specific to one lucky selector or one budget.

**Lo-V and Hi-I are complementary.** At 5,760 tokens: Lo-V only (256 frames) = 64.44%; Hi-I only (16 SemDiv images) = 63.74%; 128 Lo-V + 8 Hi-I = **66.81%**. Dense temporal context and precise spatial detail are not interchangeable.

**LoHi resolves the R vs. ¬R trade-off.**

| Config (same budget) | R | ¬R | All |
|---|---|---|---|
| 64F&#64;0.5 | 72.73 | 58.54 | 62.30 |
| 256F&#64;0.25 | 71.89 | 61.76 | 64.44 |
| LoHi-Uniform | 76.64 | 61.86 | 65.78 |
| LoHi-Anchor | 75.38 | 62.47 | 65.89 |
| **LoHi-SemDiv** | **77.06** | **63.12** | **66.81** |

Single configurations must pick a side; every LoHi variant beats both of them on both subsets.

### 4.5 Generalization

LoHi transfers **without retuning any hyperparameter**:

- **Qwen3-VL-8B** with only K = 4 (about 25% *fewer* tokens): LoHi-Anchor reaches **67.70** on VideoMME, LoHi-SemDiv reaches **75.34** on MLVU and **46.80** on LVBench, all above the strongest prior baseline;
- **Qwen3.5-4B**: dense low-res wins again (+6.67 / +9.39 / +2.91 over 16F&#64;1.0), and LoHi-SemDiv reaches **68.15 / 70.42 / 46.68**, beating 256F&#64;0.25 everywhere;
- **Qwen2.5-VL-7B, VideoChat3-4B, VideoLLaMA3-7B**: the dense low-res base beats the 16-frame recipe on every backbone, and LoHi-SemDiv improves over it in 7 of 9 model–benchmark pairs (the other two within 0.3).

### 4.6 What do the Hi-I frames actually recover?

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/lohi/lov_case.png" alt="Hi-I frames restore fine detail" style="width: 85%; max-width: 900px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 4: The answer depends on a small detail on the interviewee's chin. Lo-V alone is wrong at 16, 32, 128 and 256 frames — the detail is simply blurred. The four Hi-I frames chosen by LoHi-SemDiv restore it.</figcaption>
</figure>

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/lohi/vis_lohi.jpg" alt="Anchor and SemDiv examples" style="width: 95%; max-width: 1000px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 5: (A) LoHi-Anchor replaces a black frame with the Lo-V grid frame closest to the nearest I-frame, recovering the scoreboard that answers the question. (B) LoHi-SemDiv picks two query-relevant frames spanning the museum before and after the bombing.</figcaption>
</figure>

---

## 5. Some Questions We Got

**Q: "Coverage vs. detail" sounds intuitive. What is new?**  
Fair point — it is how humans skim a long video. What's new is that existing efficient methods **don't act on it**: they all keep native resolution, none trades resolution for coverage, and none accounts for front-end decoding. Once you formalize the problem as joint allocation, Low-Res-Base falls out immediately, and it already beats the dedicated methods. The same view is what reveals LoHi's operating point: decode 128 of 256 frames, at about 65% of the dense baseline's TTFT, while scoring higher.

**Q: What if the selector misses the key frame?**  
Then the frame is still there — in the Lo-V stream, at low resolution. A miss is contained by design. Under total selector failure LoHi falls back to its Lo-V base (63.00% on VideoMME), and in practice all 12 selector × K configurations stay within 65.22–66.81%.

**Q: Does it need training?**  
No. It only uses the video and image pathways that unified VLMs already have, plus one sentence of text.

---

## 6. Summary and Insights

1) Long-video efficiency is not only about *which tokens to keep*. Treating frame count, per-frame resolution and front-end latency as **one allocation problem** exposes a very strong baseline (dense low-res) that the field has mostly skipped.

2) **Measure the front-end.** The token budget is what the VLM sees, but the video decoder is what the user waits for. On hour-long videos, decode-then-select pipelines spend tens of seconds before the model sees anything.

3) For video, **global context beats fragmented detail**. Simple resizing outperforms token pruning at the same budget; LoHi then adds back the little detail that resizing loses.

4) The decomposition is modular: richer selectors, adaptive K, and learned coverage-aware routing all fit into the same Lo-V + Hi-I template.

## Final Thoughts

Honestly, the most surprising part for me was Section 4.3. After working on token pruning in MMTok, it was a little humbling to see a plain resize beat every pruning method (including mine) on long videos. But I think this is the right lesson: for images, redundancy lives *inside* a frame; for long videos, the bigger redundancy is in *how we sample the timeline* — and the biggest hidden cost is the decoder that nobody profiles.

This is also why we are building **[LongVideo-Eval](https://sixundong.com/projects/longvideo-eval)**: a system-aware, complete-cost evaluation harness for long-video intelligence. It compares long-video pipelines under fixed backbones, matched evidence budgets, and one shared cost ledger spanning video-side and model-side work, with decoding, ViT, prefill and everything else metered in one place. LoHi will be released there.

Finally, thank you for reading! Welcome any questions, any discussions, and any criticism of this work!

---

## References

- **Paper:** [Rethinking Long-Video Efficiency: A Joint Allocation Perspective on Frames, Pixels, and Front-End Latency](https://arxiv.org/abs/2610.04318) · [OpenReview](https://openreview.net/forum?id=a9xLyT4hG4)
- **Project Page:** [sixundong.com/projects/lohi](https://sixundong.com/projects/lohi)
- **Related:** [MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs](https://arxiv.org/abs/2508.18264)
- **Personal Homepage:** [Sixun Dong - Academic Homepage](https://sixundong.com/)

---

## Citation

If you find this work useful, please consider citing:

```bibtex
@inproceedings{dong2026lohi,
  title     = {Rethinking Long-Video Efficiency: A Joint Allocation Perspective on Frames, Pixels, and Front-End Latency},
  author    = {Dong, Sixun and Li, Wei and Deng, Andong and Qian, Qi and Zhu, Victor and Ji, Zhengping and Chen, Chen},
  booktitle = {Advances in Neural Information Processing Systems (NeurIPS)},
  year      = {2026},
  eprint    = {2610.04318},
  archivePrefix = {arXiv},
  url       = {https://arxiv.org/abs/2610.04318}
}
```

---

**Finally, welcome any questions, any discussions, and any criticism of this work!** 🚀
