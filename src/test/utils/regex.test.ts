import { RegEx } from "../../utils";
import { describe, it } from '@jest/globals';

describe('RegEx', () => {
  describe('METADATA_BLOCK', () => {
    it('should detect all metadata blocks', () => {
      const originalText = `--- 
Starting Meta1
---

This is a text

--- 
this: is
meta: block
with: >
  multiple
  new lines
---  
And here is another.
Meta block.
---
with: ['different', 'values']
and:
 - endings
...

The End`;

      const expected = `
This is a text

And here is another.
Meta block.

The End`;

      const result = originalText.replace(RegEx.METADATA_BLOCK, '');
      expect(result).toBe(expected);
    });

    it('should not detect incorrect or incomplete metadata blocks', () => {
      const originalText = `----
Starting Meta1
  ---
The above is not a metadata block, it starts with spaces
--- this is not a metadata block

---

This has no enclosing meta char`;

      const result = originalText.replace(RegEx.METADATA_BLOCK, '');
      expect(result).toBe(originalText);
    });
  });

  describe('METADATA_MARKER_START', () => {
    it.each([
      '---',
      '---  ',
      '--- ',
      '---   '
    ])('should detect [%s] as meta start block', (line) => {
      expect(RegEx.METADATA_MARKER_START.test(line)).toBeTruthy();
    });

    it.each([
      '----',
      '  ---',
      '--',
      '...'
    ])('should not detect [%s] as meta start marker', (line) => {
      expect(RegEx.METADATA_MARKER_START.test(line)).toBeFalsy();
    });
  });

  describe('METADATA_MARKER_END', () => {
    it.each([
      '---',
      '---  ',
      '--- ',
      '---   ',
      '...',
      '...  ',
      '... ',
      '...   '
    ])('should detect [%s] as end start block', (line) => {
      expect(RegEx.METADATA_MARKER_END.test(line)).toBeTruthy();
    });

    it.each([
      '----',
      '....',
      '  ---',
      '--',
      ' ...'
    ])('should not detect [%s] as meta end marker', (line) => {
      expect(RegEx.METADATA_MARKER_END.test(line)).toBeFalsy();
    });
  });
});