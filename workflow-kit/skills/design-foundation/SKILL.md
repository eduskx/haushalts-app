---
name: design-foundation
description: Researches platform guidelines and competitors, then produces design principles, a checkable rule list and style directions for human selection. Use once before the first UI code of a project.
---

# Design foundation

The aim is a foundation a human can choose from and a reviewer can check against. Agents can prepare taste decisions but not make them.

## Input

A short brief from the human: target platform, audience, desired feeling, things to avoid, competitors they know. Ask if any of it is missing.

## Research

Use deep research if it is available, and cite every claim. Write to `docs/design/research.md` in `project.language`.

1. **Platform guidelines:** navigation, touch targets, safe areas, type, contrast, motion, dark mode. For each, note what the actual tech stack can do, plus licensing limits on fonts and icons.
2. **Competitors and role models:** what they do for first run, daily return, and delight. What users complain about in reviews. Include apps outside the category that nail the desired feeling.
3. **Risks of the concept itself:** ways the mechanics could harm the user's experience, even if they look good on paper.

## Output

1. `docs/design/principles.md`: 5 to 7 principles that can settle a real decision. A principle nobody would disagree with is useless.
2. `docs.hig`: rules with concrete values that a reviewer can check from code or a screenshot.
3. `docs/design/directions.html`: two or three clearly different directions in one clickable page usable on the target device. Each shows colours, shape, type, one real screen and any signature element.

## Gate

Stop here. The human picks a direction on a real device and can mix. Only then write the token set into the UI package. Keep token names semantic and values out of generic packages, so another app can supply its own theme.
