# Hexercise

A free, no-login practice tool for binary, hexadecimal and floating point. It generates random questions, and students type an answer and press **Check**. The box turns green if they are right and red if not. Working is done on paper to taught methods.

**Live site:** https://rwoodrow.github.io/Hexercise/

> Inspired by the ideas of the now-retired *Bag of Cows* binary question generator by Anton Leach. This is an independent implementation. It contains none of the original's code, artwork or branding.

## What it does

- 12 question types, grouped by level (GCSE, H446, AS, A2):
  - Binary whole numbers, addition, subtraction and multiplication
  - Hexadecimal and denary, and hexadecimal and binary (standard and advanced)
  - Two's complement negative numbers
  - Binary fractions
  - Real numbers (two's complement mantissa and exponent)
  - Floating point addition and subtraction
- **Question code:** the code is a seed. The same code, number of questions and ticked types always give the same questions, so a teacher can give a class one code and everyone gets the same set. Leave it blank for a fresh random set.
- **Written Test:** hides the answer boxes and leaves space for working, for printing.
- **Show answers:** reveals the answer under each question, for marking.
- **Shareable links:** the settings are stored in the web address, so you can share a link that opens the same question set.

## Using it

1. Tick the question types you want, or press **GCSE**, **H446**, **AS** or **A2** to tick a whole level.
2. Optionally enter a question code and the number of questions.
3. Press **Refresh**.

### Marking rules

- Fixed-width answers (for example "convert 135 to 8 bit binary") must have exactly the right number of digits.
- Arithmetic answers and hex answers may leave out leading zeros. Hex can be upper or lower case, with or without `0x`.
- Floating point answers must be the exact decimal value.

## Hosting

It is a single static `index.html` with no dependencies and no build step.

1. Put `index.html` (and your `logo.png`, if you use one) in the root of a repository.
2. Go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.

## Customising

- **Logo:** replace the `logo-slot` element near the top of `index.html` with `<img class="logo" src="logo.png" alt="College logo">`.
- **Colours:** the main colours are defined in the `:root` block at the top of the `<style>` section.
- **Question types:** each type is a small generator function in the script. Add a new one to the `TYPES` list to include it in the table.

## Testing

The question generators were checked by generating thousands of questions across many seeds and confirming that each correct answer is accepted, wrong answers are rejected, and the same seed repeats. Floating point answers were recomputed independently.

## Licence

Released under the MIT Licence. See `LICENSE`.

Copyright (c) 2026 YOUR NAME
