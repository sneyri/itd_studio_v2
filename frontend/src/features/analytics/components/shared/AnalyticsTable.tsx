import type { ReactElement } from 'react'

interface AnalyticsTableProps {
    columns: string[]
    rows: Array<Record<string, string | number>>
}

export function AnalyticsTable({ columns, rows }: AnalyticsTableProps): ReactElement {
    return (
        <div className="analytics-table-wrap">
            <table className="analytics-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={`row-${index}`}>
                            {columns.map((column) => (
                                <td key={`${column}-${index}`}>{row[column] ?? '—'}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
