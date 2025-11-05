import { NS, } from "@ns";
import { getSwarm } from "./lib/swarm"

function printTable<T extends Record<string, any>>(
    ns: NS,
    data: T[],
    columns: { key: string; header?: string }[] | string[]
): void {
    if (data.length === 0) {
        ns.tprint('No data to display');
        return;
    }

    // Normalize columns to objects with key and header
    const normalizedColumns = columns.map(col =>
        typeof col === 'string' ? { key: col, header: col } : col
    );

    // Helper function to get nested value using dot notation
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((curr, key) => curr?.[key], obj);
    };

    // Calculate column widths
    const columnWidths = normalizedColumns.map(({ key, header }) => {
        const headerWidth = (header || key).length;
        const maxDataWidth = Math.max(
            ...data.map(row => String(getNestedValue(row, key) ?? '').length)
        );
        return Math.max(headerWidth, maxDataWidth);
    });

    // Create separator line
    const separator = '+' + columnWidths
        .map(width => '-'.repeat(width + 2))
        .join('+') + '+';

    // Print header
    const header = normalizedColumns
        .map(({ key, header }, i) => (header || key).padEnd(columnWidths[i]))
        .join(' | ');

    ns.tprint(separator);
    ns.tprint(`| ${header} |`);
    ns.tprint(separator);

    // Print rows
    data.forEach(row => {
        const rowStr = normalizedColumns
            .map(({ key }, i) => String(getNestedValue(row, key) ?? '').padEnd(columnWidths[i]))
            .join(' | ');
        ns.tprint(`| ${rowStr} |`);
    });

    ns.tprint(separator);
}

export async function main(ns: NS) {
    const servers = getSwarm(ns)

    printTable(ns, servers, [
        { key: 'hostname', header: 'Host' },
        { key: 'target', header: 'Target' },
        { key: 'hack', header: 'Script' },
    ]);
}
