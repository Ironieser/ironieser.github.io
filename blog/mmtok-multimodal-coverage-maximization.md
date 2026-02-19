---
title: "ICLR'26 | MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs"
date: "2026-02-19"
description: "My ICLR 2026 work on efficient vision token pruning for Vision-Language Models. We propose a training-free, multimodal coverage maximization approach that achieves 1.87× speedup while maintaining 95%+ performance. The key insight: leverage both vision and text tokens to select informative patches, not just one modality."
tags: ["Vision-Language Models", "Efficient Inference", "Token Pruning", "Multimodal Learning", "ICLR 2026"]
image: "images/blog/mmtok/combined_plots.png"
---

# ICLR'26 | MMTok: Multimodal Coverage Maximization for Efficient Inference of VLMs

> _Sharing my new work here — hope you'll bear with any shortcomings, and welcome any suggestions, comments, or critiques! This work was mainly completed during my summer internship at Zoom. The core problem we're solving: **How to make vision-language models run faster and use less memory without training, while maintaining performance?**_

<!-- **Update (2026.02):** Updated and optimized the blog post, added more algorithm explanation diagrams and visualization results to help everyone understand better.

**Update (2026.01):** This paper has been accepted to **ICLR 2026**! Thanks to the kind reviewers and AC. In the revision, we added multi-turn conversation analysis, Qwen-2.5-VL runtime analysis, runtime analysis of the proposed module (~7ms), comparison with resize methods, and attempts to integrate the method into the decoding stage. -->

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

## Core Takeaways

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin: 2rem 0;">
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #4a90e2;">
    <h4 style="margin-top: 0; color: #4a90e2;">🎯 Takeaway 1: New Criterion</h4>
    <p style="margin-bottom: 0;">From independent ranking to set coverage — formulate pruning as a coverage objective so that every selected token brings maximum marginal gain.</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #4a90e2;">
    <h4 style="margin-top: 0; color: #4a90e2;">🧠 Takeaway 2: Truly Multimodal</h4>
    <p style="margin-bottom: 0;">Jointly optimizes Text–Vision and Vision–Vision coverage, balancing query relevance with global visual context.</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #4a90e2;">
    <h4 style="margin-top: 0; color: #4a90e2;">⚡ Takeaway 3: Training-Free</h4>
    <p style="margin-bottom: 0;">A plug-and-play module with sub-millisecond latency (as low as 0.8ms) and linear time complexity \(O(nk)\), requiring no finetuning.</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #4a90e2;">
    <h4 style="margin-top: 0; color: #4a90e2;">📊 Takeaway 4: Superior Performance</h4>
    <p style="margin-bottom: 0;">Achieves 1.87× speedup while maintaining 95%+ performance, and still keeps 87.7% performance even with only 4 vision tokens.</p>
  </div>
</div>

---

## 1. Core Motivation

As we all know, Vision-Language Models (VLMs) process images by cutting them into hundreds or thousands of patches, encoding them into vision tokens, then concatenating them with text tokens before feeding to the language model.

**The problem:**

- Text usually has only ~10 tokens, but images can produce up to **2880 vision tokens**;
- Self-attention computation is quadratic — more tokens mean slower inference and exploding memory;
- In real applications (e.g., edge deployment, mobile devices), thousands of tokens are often unacceptable.

**So the question is:** Do we really need thousands of vision tokens?  
Or can we keep just a few, but information-rich tokens?

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/llavanext.png" alt="Token Redundancy Problem" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 1: The problem — vision tokens can reach up to 2880 tokens, creating massive inference bottlenecks. Our goal: prune 95% while maintaining performance.</figcaption>
</figure>

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

<figure style="margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; max-width: 900px; margin-left: auto; margin-right: auto;">
    <div style="text-align: center;">
      <img src="images/blog/mmtok/sparsevlm.png" alt="SparseVLM" style="width: 400px; height: 300px; object-fit: contain; display: block; margin: 0 auto;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>SparseVLM</strong><br>Language-only Top-K</p>
    </div>
    <div style="text-align: center;">
      <img src="images/blog/mmtok/visionzip.png" alt="VisionZIP" style="width: 400px; height: 300px; object-fit: contain; display: block; margin: 0 auto;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>VisionZIP</strong><br>Vision-only Top-K</p>
    </div>
    <div style="text-align: center;">
      <img src="images/blog/mmtok/divrpune.jpg" alt="DivPrune" style="width: 400px; height: 300px; object-fit: contain; display: block; margin: 0 auto;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>DivPrune</strong><br>Vision-only Diversity</p>
    </div>
    <div style="text-align: center;">
      <img src="images/blog/mmtok/mmtok.jpg" alt="MMTok" style="width: 400px; height: 300px; object-fit: contain; display: block; margin: 0 auto; border: 2px solid #4a90e2; border-radius: 4px;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>MMTok</strong><br>Multimodal Coverage</p>
    </div>
  </div>
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666; text-align: center;">Figure 2: Previous Work vs. MMTok — Comparison of different token pruning approaches</figcaption>
</figure>

---

## 3. Method: MMTok

### Intuition: Why Coverage Works Better?

Imagine you are assembling a soccer team: you need to pick 11 players from the entire roster so that you both cover all key positions (forwards, midfielders, defenders) and keep the overall formation balanced.  
Traditional **Top-K** selection is like choosing all the highest-scoring players — you might end up with only forwards and a completely unbalanced lineup.  Top-K Ranking creates an "Information Blackout" in non-salient regions, while MMTok ensures no crucial visual context is left behind.
**Diversity-based** selection spreads players out, but may pick ones that have little to do with your actual tactic.  
In contrast, **Coverage-based** selection simultaneously considers both “position importance” and “formation balance”, giving you a compact yet well-covered team.

<figure style="margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 1000px; margin-left: auto; margin-right: auto;">
    <div style="text-align: center;">
      <img src="images/blog/mmtok/football_topk.png" alt="Top-K Ranking" style="width: 100%; max-width: 320px; height: auto; display: block; margin: 0 auto;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>Top-K Ranking</strong></p>
    </div>
    <div style="text-align: center;">
      <img src="images/blog/mmtok/football_diversity.png" alt="Diversity-based" style="width: 100%; max-width: 320px; height: auto; display: block; margin: 0 auto;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>Diversity-based</strong></p>
    </div>
    <div style="text-align: center;">
      <img src="images/blog/mmtok/football_coverage.png" alt="Coverage" style="width: 100%; max-width: 320px; height: auto; display: block; margin: 0 auto; border: 2px solid #4a90e2; border-radius: 4px;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>Coverage (MMTok)</strong></p>
    </div>
  </div>
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666; text-align: center;">Figure 3: Why Maximum Coverage? — Top-K Ranking clusters redundantly (all forwards), Diversity-based scatters without semantics, Coverage (MMTok) balances distribution</figcaption>
</figure>

**❌ Top-K (Simple Ranking)**  
Evaluates each token independently, which almost inevitably leads to heavy redundancy. It is like selecting only forwards on a soccer team — tokens cluster in very similar regions (all forwards), wasting most of the token budget.

**⚠️ Diversity-based**  
Focuses on maximizing diversity *within* the selected subset. Tokens look visually scattered, but the method often sacrifices semantic relevance to the actual query.

**✅ Coverage Maximization (MMTok)**  
Optimizes **set coverage** (inter-set similarity): the selected subset should comprehensively represent the entire original information space. By evaluating the marginal gain of each token, MMTok ensures every new patch contributes strictly fresh information, striking a balance between query relevance and global context.

---

### Core Idea: Maximum Coverage Problem

Our core idea is to cast the token selection problem as a **maximum coverage problem (Max-K-Coverage)**.

Given thousands of vision tokens, we want to select a small subset that still “covers” as much useful information as possible:

- Cover text-relevant semantics (e.g., the objects and regions asked about in the query);
- Cover the overall image content, so that important areas are not missed.

<figure style="margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; max-width: 1000px; margin-left: auto; margin-right: auto;">
    <div style="text-align: center;">
      <img src="images/blog/mmtok/simple_ranking.png" alt="Simple Ranking" style="width: 100%; max-width: 450px; height: auto; display: block; margin: 0 auto;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>Simple Ranking</strong></p>
    </div>
    <div style="text-align: center;">
      <img src="images/blog/mmtok/max_coverage.png" alt="Maximum Coverage" style="width: 100%; max-width: 450px; height: auto; display: block; margin: 0 auto; border: 2px solid #4a90e2; border-radius: 4px;">
      <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;"><strong>Maximum Coverage (MMTok)</strong></p>
    </div>
  </div>
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666; text-align: center;">Figure 4: Comparison of Simple Ranking vs. Maximum Coverage — Maximum coverage ensures comprehensive information representation</figcaption>
</figure>

Moreover, the maximum coverage problem is a classic **submodular optimization** problem with a well-known greedy solution that comes with approximation guarantees. This allows us to **greatly reduce the number of tokens while preserving information coverage**.

As illustrated in our method figure, we decompose coverage into three parts:

- **Text–Vision Coverage**: ensures selected vision tokens are highly relevant to the query text tokens;
- **Vision–Vision Coverage**: ensures these tokens represent the main information of the entire image;
- **Multimodal Coverage**: combines both to obtain the final subset.

The entire process is very lightweight (0.7ms+): it only requires computing similarity matrices and running greedy selection, without any additional training.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/mmtok.jpg" alt="MMTok Architecture" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 5: MMTok Framework — Training-free vision token pruning inserted after vision encoder, requiring no modifications to LLM internal structure</figcaption>
</figure>

---

### Visualizing the Greedy Selection Process: Step-by-Step

Here we use a visual example to explain the greedy selection process. This example shows how MMTok uses **marginal gain maximization** to pick tokens, ensuring that each new token brings **strictly fresh information**:

**Step 1: Query-Relevant Selection**
  <p>Because the query contains the words <strong>“traffic”</strong> and <strong>“light”</strong>, and there are many cars in the image, the <strong>Car patch</strong> is selected first as the token with the largest information gain, followed by the <strong>Traffic Light</strong>.</p>
*At this point, the selected patches already cover the main information of both the query and the image.*

**Step 2: Information Gain Maximization**
Since there is still token budget left, the next choice is the **Sky**, as a token that captures sky features. The sky occupies a large area, so multiple sky-related patches are selected consecutively to keep sufficient visual information under a very sparse budget.
*This explains why the selected tokens look “scattered” — the algorithm is explicitly searching for strictly fresh information.*

**Step 3: Completing Coverage**

Finally, the algorithm continues to select patches for the **road** and the **billboard**, further enriching global visual information and making the coverage more complete.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/traffic_light.png" alt="Traffic Light Detection" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 6: Greedy selection process visualization — showing how MMTok iteratively selects tokens with maximum marginal gain (Car → Traffic Light → Sky → Road → Billboard)</figcaption>
</figure>

---

### Max-K-Coverage: Mathematical Foundation

Now let's dive into the mathematical foundation. Max-K-Coverage is a classic NP-Hard problem: given several sets, select at most K of them such that their union has as many elements as possible. This problem is closely related to many practical applications (information retrieval, sensor placement, influence propagation, and visual token selection here) because it essentially involves "coverage maximization."

However, this is an **NP-hard problem** — there's no known polynomial-time algorithm that can guarantee always finding the optimal solution. Once the problem scale grows, exhaustive search becomes exponentially explosive.

But Max-K-Coverage has good news: its objective function has **submodularity**, i.e., the property of "diminishing marginal returns." Using this, a very simple **greedy algorithm** (selecting the set that brings the largest gain each time) can get an approximate solution with a strict guarantee: at least **63% of optimal** (1 - 1/e). This is why it's a classic theoretical and practical case in combinatorial optimization.

For MMTok, we mainly need to define the **"marginal gain equation"**:

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/greedy_function.png" alt="Marginal Gain Function" style="width: 70%; max-width: 700px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 7: Marginal gain equation — the core of MMTok's greedy selection</figcaption>
</figure>

Here's the algorithm pseudocode. Please pay attention to **L5: computing marginal gain** and **L8: selecting the element with maximum gain from candidates**. M_tv and M_vv are similarity matrices.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/algrothm.png" alt="Algorithm Pseudocode" style="width: 70%; max-width: 700px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 8: MMTok Algorithm — Efficient greedy selection with linear time complexity O(nk)</figcaption>
</figure>

## 4. Experimental Results

### 4.1 Main Results

We evaluated our method on multiple models and benchmarks, including: LLaVA-1.5 (7B/13B), LLaVA-NeXT (7B/13B), Qwen-2.5-VL-7B.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/combined_plots.png" alt="Performance Comparison" style="width: 90%; max-width: 1000px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 13: Performance comparison — MMTok results across multiple models and datasets</figcaption>
</figure>

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/tab1.png" alt="High-IC Dataset Results" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 10: High-IC dataset results with extreme compression</figcaption>
</figure>


<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/tab2.png" alt="Main Results Table" style="width: 90%; max-width: 1000px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 9: Main experimental results across multiple models and datasets</figcaption>
</figure>

**Some interesting results:**

- On LLaVA-NeXT-13B, keeping only **160 / 2880 tokens (5.5%)**, we still maintain **95%+ performance** with nearly **2× speedup**;
- **Extreme compression**: Using only **4 vision tokens**, we still maintain **87.7%** performance;
- Performance is quite good, even exceeding VisionZIP which requires finetuning;
- Memory usage reduced by **30%+**, inference time on H100 almost halved.

**In one sentence:** The vast majority of vision tokens are redundant. Even Qwen 2.5 VL, based on dynamic resolution, has 80% redundancy.

### 4.2 High-IC Datasets vs. Extreme Compression Rate

Further, we defined an evaluation metric for VLMs on specific datasets: **Image Contribution (IC)**, i.e., the performance improvement ratio relative to 0 vision token input when using all vision tokens. We found that some datasets like TextVQA, SQA receive very little gain from vision tokens. We further tested with fewer vision tokens on High-IC datasets, with average results shown in the table below.


<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/pope_4token.png" alt="POPE 4 Token Results" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 11: Extreme compression to 4 tokens on POPE dataset — still maintains 87.7% performance</figcaption>
</figure>

**In one sentence:**

Multimodal coverage is more robust: Vision-only often loses query semantics, Text-only easily ignores global image information. Combining information from both sides can maintain performance even under extreme compression. Different tasks have different dependencies on token selection, but multimodal coverage is a more universal criterion.

### 4.3 Ablation Studies

We tested single-modality effects: T-V and V-V, i.e., Text-Vision and Vision-Vision.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/ablation.png" alt="Ablation Study" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 12: Ablation study — impact of Text-Vision (T-V) and Vision-Vision (V-V) components</figcaption>
</figure>


### 4.4 Inference Acceleration

MMTok achieves **O(kn) time complexity** through max operation, so even with 2880 tokens, runtime is less than 7ms. With 576 input tokens and selecting 16 tokens, it's only **0.77ms**.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/inference_time.png" alt="Inference Time Analysis" style="width: 70%; max-width: 700px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 14: Inference time analysis — MMTok module overhead is minimal (0.77ms - 6.4ms)</figcaption>
</figure>

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/end2end_time.png" alt="End-to-End Acceleration" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 15: Actual end-to-end acceleration effects — significant speedup across different models</figcaption>
</figure>

### 4.5 Multi-turn Conversation & Answer Drift

MMTok's multimodal coverage, where vision–vision coverage ensures it can adapt to multi-turn conversations:

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/multiturn.png" alt="Multi-turn Conversation" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 17: Multi-turn Conversation & Answer Drift</figcaption>
</figure>

### 4.6 Comparison with Diversity-Based Methods

We also compare with DivPrune (diversity-based method) to show the importance of semantic alignment:

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/vis_compared.jpg" alt="MMTok vs DivPrune" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 18: MMTok vs. DivPrune — MMTok selects tokens relevant to the query while preserving important visual information, whereas DivPrune selects visually diverse patches without semantic relation to the query</figcaption>
</figure>

From the visualization, we can observe that **MMTok selects top patches according to word-to-patch similarity**, which aligns well with the question semantically. In contrast, **DivPrune selected top patches without any close semantic relation to the question**.

This further demonstrates that MMTok can help significantly reduce the number of tokens without losing the semantic relation to the questions, providing better performance compared to diversity-based methods.

---

### 4.7 Future Interesting Directions

Please see the visualization below, showing how difficulty affects token quantity requirements. **Difficulty-adaptive Token Pruning** is an interesting direction.

<figure style="text-align: center; margin: 2rem 0;">
  <img src="images/blog/mmtok/token_num.png" alt="Token Number Requirements" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">
  <figcaption style="margin-top: 0.5rem; font-style: italic; color: #666;">Figure 19: Token number requirements analysis — showing how difficulty affects token quantity needs</figcaption>
</figure>

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
