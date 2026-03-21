// import { createNextRouteHandler } from "uploadthing/next";

// import { ourFileRouter } from "./core";

// // Export routes for Next App Router
// export const { GET, POST } = createNextRouteHandler({
//   router: ourFileRouter,
// });


// TEMP FIX: disable uploadthing

export async function GET() {
  return new Response("UploadThing disabled", { status: 200 });
}

export async function POST() {
  return new Response("UploadThing disabled", { status: 200 });
}