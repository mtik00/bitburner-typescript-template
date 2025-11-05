If you run the solver and see unknown or failed puzzles:

1. Search the name of the puzzle in the bitburner source code
2. Find the Typescript class that defines the `generate()` and `solver()` methods
3. copy the code into Claude
4. ask it: `I'm trying to copy the solver code into a script.  I need to call the solver with only (ns, data), and it should only return the answer.`
5. copy the function into `solve-contract.ts`
6. add a new `case` for the puzzle title
