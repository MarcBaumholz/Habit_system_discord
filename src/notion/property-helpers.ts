/**
 * Type-safe property access helpers for Notion API responses
 * 
 * These helpers provide a consistent way to extract values from Notion properties
 * and handle undefined/null cases gracefully.
 */

/**
 * Extract rich_text content from Notion property
 */
export function getRichText(prop: any): string | undefined {
  return prop?.rich_text?.[0]?.text?.content;
}

/**
 * Extract title content from Notion property
 */
export function getTitle(prop: any): string | undefined {
  return prop?.title?.[0]?.text?.content;
}

/**
 * Extract checkbox value from Notion property
 */
export function getCheckbox(prop: any): boolean | undefined {
  return prop?.checkbox;
}

/**
 * Extract date value from Notion property
 */
export function getDate(prop: any): string | undefined {
  return prop?.date?.start;
}

/**
 * Extract number value from Notion property
 */
export function getNumber(prop: any): number | undefined {
  return prop?.number;
}

/**
 * Extract relation ID from Notion property
 */
export function getRelation(prop: any): string | undefined {
  return prop?.relation?.[0]?.id;
}

/**
 * Extract select value from Notion property
 */
export function getSelect(prop: any): string | undefined {
  return prop?.select?.name;
}

/**
 * Extract multi_select values from Notion property
 */
export function getMultiSelect(prop: any): string[] {
  return prop?.multi_select?.map((item: any) => item.name) || [];
}
