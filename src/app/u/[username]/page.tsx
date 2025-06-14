"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
// import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { messageSchema } from "@/schemas/messageSchema";
import { ApiResponse } from "@/types/ApiResponse";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";

const specialChar = "||";

// const parseStringMessages = (messageString: string): string[] => {
//   if(!messageString) return []
//   return messageString.split(specialChar).filter((msg) => msg.trim());
// };

// Helper function to parse messages

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

const parseStringMessages = (messageString: string): string[] => {
  return messageString.split(specialChar);
};

const innitialMessages = parseStringMessages(initialMessageString);

export default function SendMessage() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState("");
  const params = useParams<{ username: string }>();
  const username = params.username;

  const fetchSuggestedMessages = async () => {
    setIsSuggestionLoading(true);

    setError("");
    setSuggestions([]);

    try {
      const res = await fetch("/api/suggest-messages", {
        method: "POST",
        body: JSON.stringify({ prompt: "" }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
      }

      const newSuggestions = parseStringMessages(fullText);

      setSuggestions(newSuggestions);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch suggestions.");
    } finally {
      setIsSuggestionLoading(false);
    }
  };

  // const suggestedMessages = parseStringMessages(fullText);
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const messageContent = form.watch("content");

  const handleMessageClick = (message: string) => {
    form.setValue("content", message);
    setSelectedMessage(message);
    console.log("Selected message:", message);
  };

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post<ApiResponse>("/api/send-message", {
        ...data,
        username,
      });

      toast(`Success:${response.data.success}`, {
        description: `${response.data.messages}`,
      });
      console.log("send message", response.data);
      form.reset({ ...form.getValues(), content: "" });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast("Error", {
        description:
          axiosError.response?.data.message ?? "Failed to sent message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Public Profile Link
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Send Anonymous Message to @{username}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your anonymous message here"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center">
            {isLoading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading || !messageContent}>
                Send It
              </Button>
            )}
          </div>
        </form>
      </Form>

      <div className="space-y-4 my-8">
        <div className="space-y-2">
          <Button
            onClick={fetchSuggestedMessages}
            className="my-4"
            disabled={isSuggestionLoading}
          >
            {isSuggestionLoading ? "Generating..." : "Suggested Messages"}
          </Button>
          <p>Click on any message below to select it.</p>
        </div>
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Messages</h3>
          </CardHeader>
          {suggestions.length ? (
            <CardContent className="flex flex-col space-y-4">
              {error ? (
                <p className="text-red-500">{error.toLowerCase()}</p>
              ) : (
                suggestions.map((message, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`p-3 border rounded cursor-pointer ${selectedMessage === message ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    {message}
                  </Button>
                ))
              )}
            </CardContent>
          ) : (
            <CardContent className="flex flex-col space-y-4">
              {error ? (
                <p className="text-red-500">{error.toLowerCase()}</p>
              ) : (
                innitialMessages.map((message, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`p-3 border rounded cursor-pointer ${selectedMessage === message ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    {message}
                  </Button>
                ))
              )}
            </CardContent>
          )}
        </Card>
      </div>
      <Separator className="my-6" />
      <div className="text-center">
        <div className="mb-4">Get Your Message Board</div>
        <Link href={"/sign-up"}>
          <Button>Create Your Account</Button>
        </Link>
      </div>

      {/* Debug info (remove in production) */}
      {/* <div className="text-sm text-gray-500">
        <pre className="mt-4 text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(completion, null, 2)}
        </pre>

        <div>Form value: {form.watch("content")}</div>
        <div>Completion: {completion}</div>
      </div> */}
    </div>
  );
}
