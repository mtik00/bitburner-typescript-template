/*
This module holds utilities for scripts that don't use any memory.
*/

/**
 * A generic function for creating autocomplete data.
 * See also: https://github.com/bitburner-official/bitburner-src/blob/stable/src/Documentation/doc/basic/autocomplete.md
 * 
 * For example:
 * 
 * export function autocomplete(data: any, args: any) {
     return createFlagAutocomplete({
       "--target": (data: any) => data.servers,
       "--script": (data: any) => data.scripts,
     })(data, args);
    }
 * 
 * @param flagConfig The configurtion for autocompleting flags
 * @returns auto-compleatable configuration
 */
export function createFlagAutocomplete(flagConfig: Record<string, any>) {
    return function (data: any, args: any) {
        const lastArg = args[args.length - 1];
        const previousArg = args.length > 1 ? args[args.length - 2] : null;

        // Check each flag in the config
        for (const [flag, values] of Object.entries(flagConfig)) {
            if (lastArg === flag || previousArg === flag) {
                // If values is a function, call it with data
                return typeof values === 'function' ? values(data) : values;
            }
        }

        // Return list of available flags
        return Object.keys(flagConfig);
    };
}
