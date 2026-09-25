"use client";
import { useParams } from "next/navigation";
import ChatView from "@/components/vn/ChatView";

export default function ChatPage() {
  const { id } = useParams();
  return <ChatView key={id} id={id} />;
}
