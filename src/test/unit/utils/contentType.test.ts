import { ContentType, SupportedContent } from "../../../utils";

describe('ContentType', () => {

	describe('constructor()', () => {

		it('should be unknown at first', () => {
			let content = new ContentType();

			expect(content.has(SupportedContent.Unknown)).toBeTruthy();

			expect(content.has(SupportedContent.Metadata)).toBeFalsy();
			expect(content.has(SupportedContent.Fiction)).toBeFalsy();
		});

		it('should properly set single value', () => {
			let content = new ContentType(SupportedContent.Metadata);

			expect(content.has(SupportedContent.Metadata)).toBeTruthy();

			expect(content.has(SupportedContent.Unknown)).toBeFalsy();
			expect(content.has(SupportedContent.Fiction)).toBeFalsy();
		});


		it('should properly set multiple values', () => {
			let content = new ContentType(SupportedContent.Metadata | SupportedContent.Fiction);

			expect(content.has(SupportedContent.Metadata)).toBeTruthy();
			expect(content.has(SupportedContent.Fiction)).toBeTruthy();

			expect(content.has(SupportedContent.Unknown)).toBeFalsy();
		});
	});

	describe('add()', () => {

		it('should properly set single value', () => {
			let content = new ContentType();
			content.add(SupportedContent.Metadata);

			expect(content.has(SupportedContent.Metadata)).toBeTruthy();

			expect(content.has(SupportedContent.Unknown)).toBeFalsy();
			expect(content.has(SupportedContent.Fiction)).toBeFalsy();
		});


		it('should properly set multiple values', () => {
			let content = new ContentType();
			content.add(SupportedContent.Metadata);
			content.add(SupportedContent.Fiction);

			expect(content.has(SupportedContent.Metadata)).toBeTruthy();
			expect(content.has(SupportedContent.Fiction)).toBeTruthy();

			expect(content.has(SupportedContent.Unknown)).toBeFalsy();
		});
	});

	describe('has()', () => {

		it('should return true if the only value is unknown', () => {
			let content = new ContentType();
			content.add(SupportedContent.Unknown);

			expect(content.has(SupportedContent.Unknown));
		});

		it('should not be possible to combine Unknown with other contents', () => {
			let content = new ContentType(SupportedContent.Metadata | SupportedContent.Unknown);

			expect(content.has(SupportedContent.Metadata)).toBeTruthy();

			expect(content.has(SupportedContent.Unknown)).toBeFalsy();
			expect(content.has(SupportedContent.Fiction)).toBeFalsy();
 		});
	});

	describe('clear()', () => {

		it('should clear all supported content', () => {
			let content = new ContentType(SupportedContent.Metadata);
			expect(content.has(SupportedContent.Metadata)).toBeTruthy();

			content.clear();

			expect(content.has(SupportedContent.Unknown)).toBeTruthy();
			expect(content.has(SupportedContent.Metadata)).toBeFalsy();
			expect(content.has(SupportedContent.Fiction)).toBeFalsy();

		});
	});
});