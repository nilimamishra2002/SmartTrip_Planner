"use client";

import React, { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import exifr from "exifr";
import axios from "axios";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import ReactMarkdown from "react-markdown";
import { storage } from "../media/firebase";

/* =========================
   TYPES
========================= */

interface BlogGeneratorProps {
  email?: string;
  name?: string;
  tripPlanId?: string;
}

interface ProgressProps {
  value?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  animated?: boolean;
}

/* =========================
   PROGRESS COMPONENT
========================= */

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  className = "",
  showLabel = true,
  size = "default",
  variant = "default",
  animated = true,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const sizeStyles: Record<string, string> = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
    xl: "h-4",
  };

  const variantStyles: Record<string, string> = {
    default: "bg-blue-500",
    primary: "bg-blue-600",
    secondary: "bg-purple-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Progress</span>
          <span className="text-gray-700 font-semibold">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div
        className={`w-full rounded-full bg-gray-100 overflow-hidden ${
          sizeStyles[size]
        } ${className}`}
      >
        <div
          className={`h-full rounded-full ${
            variantStyles[variant]
          } ${animated ? "transition-all duration-500 ease-out" : ""}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

/* =========================
   BLOG GENERATOR
========================= */

const BlogGenerator: React.FC<BlogGeneratorProps> = ({
  email,
  name,
  tripPlanId,
}) => {
  const [query, setQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [generatedTitle, setGeneratedTitle] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [editedTitle, setEditedTitle] = useState<string>("");

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number[]>([]);

  /* =========================
     GENERATE BLOG
  ========================== */

  const handleGenerateBlog = async () => {
    if (!query) return;

    try {
      setIsGenerating(true);

      const response = await axios.post("/api/blog", {
        email,
        tripPlanId,
        query,
        name,
      });

const content =
  response.data?.savedBlog?.content ||
  response.data?.blog?.content ||
  "";

const title =
  response.data?.savedBlog?.title ||
  response.data?.blog?.title ||
  "";

      setGeneratedContent(content);
      setGeneratedTitle(title);
      setEditedContent(content);
      setEditedTitle(title);
    } catch (error) {
      console.error("Error generating blog:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  /* =========================
     MARKDOWN CHANGE
  ========================== */

  const handleContentChange = ({
    text,
  }: {
    html: string;
    text: string;
  }) => {
    setEditedContent(text);
  };

  /* =========================
     FILE HANDLING
  ========================== */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    setProgress((prev) => [...prev, ...selectedFiles.map(() => 0)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setProgress((prev) => prev.filter((_, i) => i !== index));
  };

  /* =========================
     POST BLOG
  ========================== */

  const handlePostBlog = async () => {
    try {
      if (!editedContent) return;

      if (files.length > 0) {
        setProgress(files.map(() => 0));

        const uploadPromises = files.map((file, index) => {
          return new Promise<void>(async (resolve, reject) => {
            try {
              await exifr.parse(file).catch(() => null);

              const storageRef = ref(
                storage,
                `blog_images/${file.name}_${Date.now()}`
              );

              const uploadTask = uploadBytesResumable(storageRef, file);

              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const percent =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                  setProgress((prev) => {
                    const updated = [...prev];
                    updated[index] = percent;
                    return updated;
                  });
                },
                reject,
                async () => {
                  await getDownloadURL(uploadTask.snapshot.ref);
                  resolve();
                }
              );
            } catch (err) {
              reject(err);
            }
          });
        });

        await Promise.all(uploadPromises);
      }

      await axios.post("/api/blog", {
        email,
        tripPlanId,
        content: editedContent,
        title: editedTitle,
        name,
      });

      console.log("Blog published successfully");
    } catch (error) {
      console.error("Error posting blog:", error);
    }
  };

  /* =========================
     UI
  ========================== */

  return (
    <div className="flex flex-col space-y-6 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Query Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Blog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="What would you like to write about?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleGenerateBlog}
              disabled={isGenerating || !query}
            >
              {isGenerating ? "Generating..." : "Generate Blog"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Preview */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Blog Preview</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">
              {generatedTitle}
            </h2>
            <ReactMarkdown>{generatedContent}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Blog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-lg font-semibold"
            />

            <div className="h-[400px] border rounded-lg overflow-hidden">
              <MdEditor
                value={editedContent}
                style={{ height: "100%" }}
                renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                onChange={handleContentChange}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById("file-upload")?.click()
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Images
              </Button>

              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="grid gap-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <ImageIcon className="w-6 h-6 text-gray-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <Progress value={progress[index]} size="sm" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handlePostBlog}>
              Publish Blog
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlogGenerator;