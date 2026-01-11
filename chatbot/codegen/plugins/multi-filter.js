/**
 * Multi-Filter Decorator:
 * Filters operations based on multiple property/value criteria.
 * Keeps operations that match ANY of the specified filters.
 *
 * Configuration example:
 *   multi-filter/multi-filter:
 *     filters:
 *       - property: x-flip-resource-name
 *         value:
 *           - ask-ai-triggers
 *           - user-groups
 *       - property: operationId
 *         value:
 *           - get-user-profile
 */

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyObject(obj) {
  return isPlainObject(obj) && Object.keys(obj).length === 0;
}

function isEmptyArray(arr) {
  return Array.isArray(arr) && arr.length === 0;
}

function toArrayIfNeeded(value) {
  return Array.isArray(value) ? value : [value];
}

function checkIfMatchByStrategy(nodeValue, decoratorValue, strategy = 'any') {
  if (nodeValue === undefined || decoratorValue === undefined) {
    return false;
  }

  if (!Array.isArray(decoratorValue) && !Array.isArray(nodeValue)) {
    return nodeValue === decoratorValue;
  }

  const decoratorValues = toArrayIfNeeded(decoratorValue);
  const nodeValues = toArrayIfNeeded(nodeValue);

  if (strategy === 'any') {
    return decoratorValues.some((item) => nodeValues.includes(item));
  }
  if (strategy === 'all') {
    return decoratorValues.every((item) => nodeValues.includes(item));
  }
  return false;
}

/**
 * Check if an item should be filtered out (removed).
 * An item is removed if:
 * - It has at least one of the filter properties AND
 * - It doesn't match any of the filter criteria
 *
 * Items without any of the filter properties are kept (not filtered).
 */
function shouldFilterOut(item, filters) {
  if (!item || !filters || filters.length === 0) {
    return false;
  }

  const hasAnyFilterProperty = filters.some(filter => item?.[filter.property] !== undefined);

  if (!hasAnyFilterProperty) {
    return false;
  }

  const matchesAnyFilter = filters.some(filter => {
    const { property, value, matchStrategy = 'any' } = filter;
    return item?.[property] && checkIfMatchByStrategy(item[property], value, matchStrategy);
  });

  return !matchesAnyFilter;
}

function filterNode(node, ctx, shouldRemove) {
  if (!node) {
    return;
  }

  const { parent, key } = ctx;
  let didDelete = false;

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (shouldRemove(node[i])) {
        node.splice(i, 1);
        didDelete = true;
        i--;
      }
    }
  } else if (isPlainObject(node)) {
    for (const nodeKey of Object.keys(node)) {
      if (shouldRemove(node[nodeKey])) {
        delete node[nodeKey];
        didDelete = true;
      }
    }
  }

  if (didDelete && parent && key !== undefined && (isEmptyObject(node) || isEmptyArray(node))) {
    delete parent[key];
  }
}

export function MultiFilter({ filters }) {
  return {
    any: {
      enter: (node, ctx) => {
        filterNode(node, ctx, (item) => shouldFilterOut(item, filters));
      },
    },
  };
}
