---
title: "MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs"
date: "2025-02-19"
description: "My ICLR 2026 work on efficient vision token pruning for Vision-Language Models. We propose a training-free, multimodal coverage maximization approach that achieves 1.87× speedup while maintaining 95%+ performance. The key insight: leverage both vision and text tokens to select informative patches, not just one modality."
tags: ["Vision-Language Models", "Efficient Inference", "Token Pruning", "Multimodal Learning", "ICLR 2026"]
image: "images/blog/mmtok/mmtok.jpg"
---

# MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs

> _Sharing my new work here — hope you'll bear with any shortcomings, and welcome any suggestions, comments, or critiques! This work was mainly completed during my summer internship at Zoom. The core problem we're solving: **How to make vision-language models run faster and use less memory without training, while maintaining performance?**_

**Update (2026.02):** Updated and optimized the blog post, added more algorithm explanation diagrams and visualization results to help everyone understand better.

**Update (2026.01):** This paper has been accepted to **ICLR 2026**! Thanks to the kind reviewers and AC. In the revision, we added multi-turn conversation analysis, Qwen2.5VL runtime analysis, runtime analysis of the proposed module (~7ms), comparison with resize methods, and attempts to integrate the method into the decoding stage.

**Paper:** [MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs](https://arxiv.org/abs/2508.18264) (arXiv:2508.18264)  
**Code:** [GitHub – MMTok](https://github.com/Ironieser/MMTok) _(Open source! Stars welcome (・ω・))_  
**Project Page:** [project.ironieser.cc/mmtok](https://project.ironieser.cc/mmtok)

---

## TL;DR

We propose **MMTok**, a training-free vision token selection algorithm that formulates token pruning as a **maximum coverage problem**.

**Core idea:** Simultaneously cover text-relevant information (text–vision coverage) and overall image information (vision–vision coverage).

**Simple and efficient:** Just similarity computation + greedy selection, no training needed.

**Results:** Using LLaVA-NeXT-13B (up to 2880 vision tokens) as the base model, on POPE dataset, with at most 160 vision tokens (5.5%), we retain 95%+ performance and achieve nearly **2× inference speedup**. Even with extreme compression to just **4 tokens**, we still maintain **87.7%** performance.

> **In one sentence:** Coverage maximization with multimodal awareness is really powerful. No training needed, just plug it in after the vision encoder (・ω・)

---

## 1. Core Motivation

As we all know, Vision-Language Models (VLMs) process images by cutting them into hundreds or thousands of patches, encoding them into vision tokens, then concatenating them with text tokens before feeding to the language model.

**The problem:**

- Text usually has only ~10 tokens, but images can produce up to **2880 vision tokens**;
- Self-attention computation is quadratic — more tokens mean slower inference and exploding memory;
- In real applications (e.g., edge deployment, mobile devices), thousands of tokens are often unacceptable.

**So the question is:** Do we really need thousands of vision tokens?  
Or can we keep just a few, but information-rich tokens?

<img src="images/blog/mmtok/llavanext.png" alt="Token Redundancy Problem" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 1: The problem — vision tokens can reach up to 2880 tokens, creating massive inference bottlenecks. Our goal: prune 95% while maintaining performance.</em>

## 2. Existing Methods

Over the past period, researchers have proposed many token pruning methods:

1. **Vision-only**: Some only look at the image itself, e.g., using [CLS] tokens or attention strength to select;
2. **Text-only**: Some only look at text, selecting image-relevant parts based on the query;
3. **Diversity-based**: Some hope selected tokens have maximum diversity.

These methods each have their limitations:

- **Single modality bias**: Looking only at images may be task-irrelevant; looking only at text may miss global information;
- **Lack of unified criterion**: Hard to transfer across different tasks/models;
- **Some require retraining**: Adds extra overhead, not conducive to rapid deployment.

**So we want a new method that:**

- **Multimodal**: Simultaneously leverages both vision and text information;
- **Training-free**: Doesn't rely on additional finetuning, can be used directly at inference;
- **Efficient and controllable**: Preferably with theoretical guarantees, simple and implementable.

<img src="images/blog/mmtok/sparsevlm.png" alt="SparseVLM" style="width: 22%; max-width: 250px; height: auto; display: inline-block; margin: 0 1%;">
<img src="images/blog/mmtok/visionzip.png" alt="VisionZIP" style="width: 22%; max-width: 250px; height: auto; display: inline-block; margin: 0 1%;">
<img src="images/blog/mmtok/divrpune.jpg" alt="DivPrune" style="width: 22%; max-width: 250px; height: auto; display: inline-block; margin: 0 1%;">
<img src="images/blog/mmtok/mmtok.jpg" alt="MMTok" style="width: 22%; max-width: 250px; height: auto; display: inline-block; margin: 0 1%;">

<em>Figure 2: Previous Work vs. MMTok — SparseVLM (Language-only), VisionZIP (Vision-only Top-K), DivPrune (Vision-only Diversity) vs. MMTok (Multimodal Coverage)</em>

---

## 3. Method: MMTok

Our core idea: **Formulate the token selection problem as a maximum coverage problem (Max-K-Coverage)**.

Given thousands of vision tokens, we want to select a small subset that can maximally "cover" all useful information:

- Cover text-relevant semantics (e.g., things mentioned in the query);
- Cover overall image content, avoiding missing key parts.

Moreover, maximum coverage is a classic **submodular function optimization** problem with mature greedy solutions that guarantee approximate optimality. This allows us to dramatically reduce tokens while **ensuring coverage of information**.

As shown in our method diagram, we break coverage into three parts:

- **Text-Vision Coverage**: Ensures selected vision tokens are highly relevant to query text tokens;
- **Vision-Vision Coverage**: Ensures these tokens represent the main information of the entire image;
- **Multimodal Coverage**: Combines both to get the final subset.

The entire process is very lightweight (0.7ms+): just similarity matrix computation + greedy selection, completely training-free.

<img src="images/blog/mmtok/mmtok.jpg" alt="MMTok Architecture" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 3: MMTok Framework — Training-free vision token pruning inserted after vision encoder, requiring no modifications to LLM internal structure</em>

---

### Max-K-Coverage: A Brief Introduction

This is a classic NP-Hard problem. Let me briefly introduce it:

Simply put, the problem definition is: Given several sets, select at most K of them such that their union has as many elements as possible. This problem is closely related to many practical applications (information retrieval, sensor placement, influence propagation, and visual token selection here) because it essentially involves "coverage maximization."

However, this is an **NP-hard problem**. NP-hard means: Currently, there's no known polynomial-time algorithm that can guarantee always finding the optimal solution. In other words, once the problem scale grows, exhaustive search for the global optimum becomes exponentially explosive.

But Max-K-Coverage has good news: Its objective function has **submodularity**, i.e., the property of "diminishing marginal returns." Using this, a very simple **greedy algorithm** (selecting the set that brings the largest gain each time) can get an approximate solution with a strict guarantee: at least **63% of optimal** (1 - 1/e). This is why it's a classic theoretical and practical case in combinatorial optimization, and the greedy solution itself is a must-learn approximation algorithm in algorithm courses.

Combining the above introduction, it's easy to see that MMTok mainly needs to define the **"marginal gain equation"**.

<img src="images/blog/mmtok/greedy_function.png" alt="Marginal Gain Function" style="width: 70%; max-width: 700px; height: auto; display: block; margin: 0 auto;">

<em>Figure 3.1: Marginal gain equation — the core of MMTok's greedy selection</em>

<img src="images/blog/mmtok/football_topk.png" alt="Top-K Ranking" style="width: 30%; max-width: 300px; height: auto; display: inline-block; margin: 0 1%;">
<img src="images/blog/mmtok/football_diversity.png" alt="Diversity-based" style="width: 30%; max-width: 300px; height: auto; display: inline-block; margin: 0 1%;">
<img src="images/blog/mmtok/football_coverage.png" alt="Coverage" style="width: 30%; max-width: 300px; height: auto; display: inline-block; margin: 0 1%;">

<em>Figure 4: Why Maximum Coverage? — Top-K Ranking clusters redundantly (all forwards), Diversity-based scatters without semantics, Coverage (MMTok) balances distribution</em>

<img src="images/blog/mmtok/max_coverage.png" alt="Multimodal Coverage Visualization" style="width: 55%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 5: Multimodal Coverage Visualization — How MMTok's maximum coverage objective captures the total information space (text + vision)</em>

At this point, our method design is complete.

---

### Visualizing the Greedy Selection Process

Here's a visualization to help understand the greedy selection process:

First, the greedy algorithm sequentially selects new patches. Since the query contains "traffic" and "light", and there are many cars in the image, the Car patch is selected as the first token with maximum information gain. Then comes the Traffic Light. After these selections, the chosen patches already cover the main important information of the query and image. Since there's additional token budget, the next selection is Sky, as a token covering sky features. Since the sky area is large, multiple sky-related patches are selected consecutively, ensuring sufficient visual information with low redundancy. Then it continues selecting "road surface" and "billboard".

<img src="images/blog/mmtok/traffic_light.png" alt="Traffic Light Detection" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 6: Greedy selection process visualization — showing how MMTok iteratively selects tokens with maximum marginal gain (Car → Traffic Light → Sky → Road → Billboard)</em>

Finally, here's the algorithm pseudocode to help everyone understand. Please pay attention to **L5: computing marginal gain** and **L8: selecting the element with maximum gain from candidates**. M_tv and M_vv are similarity matrices.

<img src="images/blog/mmtok/algrothm.png" alt="Algorithm Pseudocode" style="width: 70%; max-width: 700px; height: auto; display: block; margin: 0 auto;">

<em>Figure 7: MMTok Algorithm — Efficient greedy selection with linear time complexity O(nk)</em>

### Why Coverage Works Better

Let me explain why coverage maximization beats simple ranking or diversity:

**❌ Top-K (Simple Ranking)**
Evaluates tokens independently. This inevitably leads to severe token redundancy, as tokens cluster in highly similar regions (like clustering all forwards in soccer) and waste the token budget.

**⚠️ Diversity-based**
Focuses on maximizing differences *within* the selected subset (intra-set diversity). While it successfully scatters tokens visually, it often sacrifices semantic relevance to the actual query.

**✅ Coverage Maximization (MMTok)**
Optimizes for collective coverage (inter-set similarity) — ensuring the selected subset comprehensively represents the entire original information space. By evaluating the marginal gain of each token, MMTok guarantees that every new patch brings strictly fresh information, perfectly balancing query relevance with global context.

## 4. Experimental Results

### 4.1 Main Results

We evaluated our method on multiple models and benchmarks, including: LLaVA-1.5 (7B/13B), LLaVA-NeXT (7B/13B), Qwen-2.5-VL-7B.

<img src="images/blog/mmtok/tab2.png" alt="Main Results Table" style="width: 90%; max-width: 1000px; height: auto; display: block; margin: 0 auto;">

<em>Figure 8: Main experimental results across multiple models and datasets</em>

**Some interesting results:**

- On LLaVA-NeXT-13B, keeping only **160 / 2880 tokens (5.5%)**, we still maintain **95%+ performance** with nearly **2× speedup**;
- **Extreme compression**: Using only **4 vision tokens**, we still maintain **87.7%** performance;
- Performance is quite good, even exceeding VisionZIP which requires finetuning;
- Memory usage reduced by **30%+**, inference time on H100 almost halved.

**In one sentence:** The vast majority of vision tokens are redundant. Even Qwen 2.5 VL, based on dynamic resolution, has 80% redundancy.

### 4.2 High-IC Datasets vs. Extreme Compression Rate

Further, we defined an evaluation metric for VLMs on specific datasets: **Image Contribution (IC)**, i.e., the performance improvement ratio relative to 0 vision token input when using all vision tokens. We found that some datasets like TextVQA, SQA receive very little gain from vision tokens. We further tested with fewer vision tokens on High-IC datasets, with average results shown in the table below.

<img src="images/blog/mmtok/tab1.png" alt="High-IC Dataset Results" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 8.1: High-IC dataset results with extreme compression</em>

<img src="images/blog/mmtok/pope_4token.png" alt="POPE 4 Token Results" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 8.2: Extreme compression to 4 tokens on POPE dataset — still maintains 87.7% performance</em>

**In one sentence:**

Multimodal coverage is more robust: Vision-only often loses query semantics, Text-only easily ignores global image information. Combining information from both sides can maintain performance even under extreme compression. Different tasks have different dependencies on token selection, but multimodal coverage is a more universal criterion.

### 4.3 Ablation Studies

We tested single-modality effects: T-V and V-V, i.e., Text-Vision and Vision-Vision.

<img src="images/blog/mmtok/ablation.png" alt="Ablation Study" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 9: Ablation study — impact of Text-Vision (T-V) and Vision-Vision (V-V) components</em>

<img src="images/blog/mmtok/combined_plots.png" alt="Performance Comparison" style="width: 90%; max-width: 1000px; height: auto; display: block; margin: 0 auto;">

<em>Figure 10: Performance comparison — MMTok results across multiple models and datasets</em>

### 4.4 Inference Acceleration

MMTok achieves **O(kn) time complexity** through max operation, so even with 2880 tokens, runtime is less than 7ms. With 576 input tokens and selecting 16 tokens, it's only **0.77ms**.

<img src="images/blog/mmtok/inference_time.png" alt="Inference Time Analysis" style="width: 70%; max-width: 700px; height: auto; display: block; margin: 0 auto;">

<em>Figure 11: Inference time analysis — MMTok module overhead is minimal (0.77ms - 6.4ms)</em>

<img src="images/blog/mmtok/end2end_time.png" alt="End-to-End Acceleration" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 12: Actual end-to-end acceleration effects — significant speedup across different models</em>

### 4.5 Multi-turn Conversation

MMTok's multimodal coverage, where vision–vision coverage ensures it can adapt to multi-turn conversations:

<img src="images/blog/mmtok/multiturn.png" alt="Multi-turn Conversation Analysis" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 13: Multi-turn conversation analysis — MMTok maintains better consistency</em>

<img src="images/blog/mmtok/vis.jpg" alt="Multi-turn Conversation" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 14: Multi-turn Conversation & Answer Drift — How the number of vision tokens affects answer consistency across dialogue turns</em>

### 4.6 Comparison with Diversity-Based Methods

We also compare with DivPrune (diversity-based method) to show the importance of semantic alignment:

<img src="images/blog/mmtok/vis_compared.jpg" alt="MMTok vs DivPrune" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 15: MMTok vs. DivPrune — MMTok selects tokens relevant to the query while preserving important visual information, whereas DivPrune selects visually diverse patches without semantic relation to the query</em>

From the visualization, we can observe that **MMTok selects top patches according to word-to-patch similarity**, which aligns well with the question semantically. In contrast, **DivPrune selected top patches without any close semantic relation to the question**.

This further demonstrates that MMTok can help significantly reduce the number of tokens without losing the semantic relation to the questions, providing better performance compared to diversity-based methods.

---

### 4.7 Future Interesting Directions

Please see the visualization below, showing how difficulty affects token quantity requirements. **Difficulty-adaptive Token Pruning** is an interesting direction.

<img src="images/blog/mmtok/token_num.png" alt="Token Number Requirements" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 16: Token number requirements analysis — showing how difficulty affects token quantity needs</em>

## 5. Summary and Insights

1) In MMTok, we propose abstracting the pruning problem into a universal coverage problem with theoretical guarantees, which can also be generalized to multimodal scenarios. This shift in problem definition might be applicable to more efficient inference areas.

2) Additionally, training-free, memory-efficient, and fast means VLMs can be more easily deployed to edge devices and low-compute environments. Tests show acceleration effects on A6000 can reach 5–8×, since on H100, GPU utilization is only 50%.

3) Based on such methods, perhaps we can explore more VLM downstream tasks under limited computational resources, such as video understanding.

4) Finally, and most importantly, if 4 vision tokens can achieve decent vision understanding performance, it seems the image tokenizer still has much room for improvement.

## Final Thoughts

Personally, as mentioned earlier, vision token redundancy is very high. Such redundancy even brings more noise, which is detrimental to benchmark leaderboard performance. Therefore, I feel we need a better image tokenizer. Also, some works have shown the reconstruction and generation capabilities of very few tokens. Perhaps there's some mysterious connection between sparse tokens used for understanding acceleration after token pruning and reconstruction/generation. A **unified image tokenizer** might not be far away.

Finally, thank you for reading this article! Welcome any questions, welcome any discussions, welcome any criticism of this work!

---

## References

- **Paper:** [MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs](https://arxiv.org/abs/2508.18264)
- **GitHub:** [Ironieser/MMTok](https://github.com/Ironieser/MMTok)
- **Personal Homepage:** [Sixun Dong - Academic Homepage](https://cv.ironieser.cc/)

---

## Citation

If you find this work useful, please consider citing:

```bibtex
@inproceedings{dong2026mmtok,
  title={{MMT}ok: Multimodal Coverage Maximization for Efficient Inference of {VLM}s},
  author={Sixun Dong and Juhua Hu and Mian Zhang and Ming Yin and Yanjie Fu and Qi Qian},
  booktitle={The Fourteenth International Conference on Learning Representations},
  year={2026},
  url={https://openreview.net/forum?id=GvPdSWZT31}
}
```

---

**Finally, welcome any questions, any discussions, and any criticism of this work!** 🚀
