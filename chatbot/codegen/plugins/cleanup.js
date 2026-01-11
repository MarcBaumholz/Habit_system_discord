/**
 * Cleanup Decorator:
 * Removes unreferenced components from the OpenAPI spec:
 * - Empty paths (paths without operations)
 * - Schemas not referenced by any path operation
 * - Unused parameters
 *
 * Configuration example:
 *   cleanup/unused-components: on
 */

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

function hasOperations(pathItem) {
  return HTTP_METHODS.some(method => pathItem[method] !== undefined);
}

function collectRefs(obj, visited = new Set()) {
  const refs = new Set();
  if (!obj || typeof obj !== 'object') return refs;

  const objKey = JSON.stringify(obj);
  if (visited.has(objKey)) return refs;
  visited.add(objKey);

  if (obj.$ref && typeof obj.$ref === 'string') {
    const match = obj.$ref.match(/#\/components\/schemas\/(.+)/);
    if (match) {
      refs.add(match[1]);
    }
  }

  // Also check discriminator mappings which reference schemas as string values
  if (obj.discriminator?.mapping) {
    for (const refValue of Object.values(obj.discriminator.mapping)) {
      if (typeof refValue === 'string') {
        const match = refValue.match(/#\/components\/schemas\/(.+)/);
        if (match) {
          refs.add(match[1]);
        }
      }
    }
  }

  for (const value of Object.values(obj)) {
    for (const ref of collectRefs(value, visited)) {
      refs.add(ref);
    }
  }

  return refs;
}

function collectTransitiveRefs(schemas, initialRefs) {
  const allRefs = new Set(initialRefs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const schemaName of allRefs) {
      const schema = schemas[schemaName];
      if (schema) {
        const beforeSize = allRefs.size;
        for (const ref of collectRefs(schema)) {
          allRefs.add(ref);
        }
        if (allRefs.size > beforeSize) {
          changed = true;
        }
      }
    }
  }
  return allRefs;
}

export function UnusedComponents() {
  return {
    Root: {
      leave(root) {
        // First, remove empty paths
        const pathsToRemove = [];
        const activePaths = {};
        if (root.paths) {
          for (const [pathName, pathItem] of Object.entries(root.paths)) {
            if (!pathItem || !hasOperations(pathItem)) {
              pathsToRemove.push(pathName);
            } else {
              activePaths[pathName] = pathItem;
            }
          }

          for (const pathName of pathsToRemove) {
            delete root.paths[pathName];
          }

          if (pathsToRemove.length > 0) {
            console.log(`🧹 Removed ${pathsToRemove.length} empty path(s)`);
          }
        }

        // Collect refs from active paths and their transitive schema refs
        if (root.components?.schemas) {
          const pathRefs = collectRefs(activePaths);
          const allReferencedSchemas = collectTransitiveRefs(root.components.schemas, pathRefs);

          // Remove unreferenced schemas
          const schemasToRemove = [];
          for (const schemaName of Object.keys(root.components.schemas)) {
            if (!allReferencedSchemas.has(schemaName)) {
              schemasToRemove.push(schemaName);
            }
          }

          for (const schemaName of schemasToRemove) {
            delete root.components.schemas[schemaName];
          }

          if (schemasToRemove.length > 0) {
            console.log(`🧹 Removed ${schemasToRemove.length} unreferenced schema(s)`);
          }
        }

        // Remove unused parameters
        if (root.components?.parameters) {
          const referencedParams = new Set();

          if (root.paths) {
            const pathsJson = JSON.stringify(root.paths);
            const paramRefs = pathsJson.matchAll(/#\/components\/parameters\/([^"]+)/g);
            for (const match of paramRefs) {
              referencedParams.add(match[1]);
            }
          }

          const paramsToRemove = [];
          for (const paramName of Object.keys(root.components.parameters)) {
            if (!referencedParams.has(paramName)) {
              paramsToRemove.push(paramName);
            }
          }

          for (const paramName of paramsToRemove) {
            delete root.components.parameters[paramName];
          }

          if (paramsToRemove.length > 0) {
            console.log(`🧹 Removed ${paramsToRemove.length} unused parameter(s)`);
          }
        }
      },
    },
  };
}

