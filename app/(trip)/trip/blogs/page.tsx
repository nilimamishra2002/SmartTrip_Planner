"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Loader2,
  Heart,
  MessageSquare,
  PenLine,
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BlogGenerator from "./generate";
import { ModalFullScreen } from "@/components/ui/modal-full";

/* =========================
   TYPES
========================= */

interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
  };
}

/* =========================
   COMPONENT
========================= */

export default function Page() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [tripPlanId, setTripPlanId] = useState<string | undefined>(
    undefined
  );
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  /* =========================
     GET TRIP PLAN ID
  ========================== */

  useEffect(() => {
    const id = searchParams.get("tripPlanId");
    if (id) {
      setTripPlanId(id);
    }
  }, [searchParams]);

  /* =========================
     FETCH BLOGS
  ========================== */

  const fetchBlogs = async () => {
    if (!tripPlanId) return;

    try {
      setLoading(true);

      const response = await axios.get("/api/blog", {
        params: {
          tripPlanId,
          query: searchQuery,
        },
      });

      setBlogs(response.data.blogs || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blogs. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripPlanId) {
      fetchBlogs();
    }
  }, [tripPlanId]);

  /* =========================
     UI
  ========================== */

  return (
    <div className="min-h-screen p-6 container mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trip Blogs</h1>

        <Button onClick={() => setIsOpen(true)}>
          <PenLine className="mr-2 h-4 w-4" />
          Generate New Blog
        </Button>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="secondary" onClick={fetchBlogs}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No blogs found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white border rounded-lg shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  {blog.title || "Untitled Blog"}
                </h2>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {blog.content?.slice(0, 120)}...
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  By {blog.author?.name || "Unknown"} •{" "}
                  {new Date(blog.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-4 text-gray-500">
                  <button className="flex items-center hover:text-red-500">
                    <Heart className="w-4 h-4 mr-1" />
                    Like
                  </button>
                  <button className="flex items-center hover:text-blue-500">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Comment
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBlog(blog)}
                >
                  Preview
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {selectedBlog && (
        <ModalFullScreen
          isOpen={true}
          onClose={() => setSelectedBlog(null)}
          title={selectedBlog.title}
          description=""
        >
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedBlog.content}
            </ReactMarkdown>
          </div>
        </ModalFullScreen>
      )}

      {/* GENERATE MODAL */}
      <ModalFullScreen
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Blog Generator"
        description="AI Blog generator will help you write engaging travel stories"
      >
        <BlogGenerator
          email={session?.user?.email || ""}
          name={session?.user?.name || ""}
          tripPlanId={tripPlanId}
        />
      </ModalFullScreen>
    </div>
  );
}