# Profile Completeness & Missing Data Calculation

## Overview

The `ProfileCompletenessService` evaluates how complete a citizen's profile is relative to target scheme eligibility parameters.

## Formula

$$\text{Profile Completeness (\%)} = \left( \frac{\text{Number of Provided Target Parameters}}{\text{Total Required Target Parameters}} \right) \times 100$$

## Responsibilities

1. **Parameter Discovery**: Collects all unique parameters required across published schemes or a specific target scheme.
2. **Missing Attribute Identification**: Pinpoints missing parameters required to convert an `UNKNOWN` evaluation into either `ELIGIBLE` or `NOT_ELIGIBLE`.
3. **Interactive Prompt Generation**: Supplies the list of missing parameters to the frontend `MissingInformationPrompt` component.
