import * as allExports from '@prisma/client';
import defaultExport from '@prisma/client';

console.log("All named exports:", Object.keys(allExports));
console.log("Default export type:", typeof defaultExport);
console.log("Default export keys:", defaultExport ? Object.keys(defaultExport) : "null");

if (allExports.PrismaClient) {
    console.log("PrismaClient found in named exports");
}
if (defaultExport && defaultExport.PrismaClient) {
    console.log("PrismaClient found in default export");
}
