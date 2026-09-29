/**
 * Pagination size shared by the admin table UI and the server-side queries.
 *
 * This lives in its own module because the table is a client component: a value
 * imported from a `"use client"` file reaches a server component as a client
 * reference rather than the actual number, which silently breaks `take`.
 */
export const PER_PAGE = 20;
