"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from '@/constants';

// Used for storing the current status of a call
enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

// Defines the format of the messages
interface SavedMessage {
    role: "user" | "system" | "assistant";
    content: string;
}

const Agent = ({userName, userId, type, interviewId, questions }: AgentProps) => {
    const router = useRouter();
    const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]); 

    useEffect(() => {
        // All functions below are custom event handlers to work with the Vapi's event system
        // Triggers once call starts
        const onCallStart = () => {
          setCallStatus(CallStatus.ACTIVE);
        };
    
        // Triggers once call ends
        const onCallEnd = () => {
          setCallStatus(CallStatus.FINISHED);
        };
        
        // Filters all the messages of type "transcript" and those that are "final" are added to the list of messages. "transcript" means message contains speech-to-text data, "final" means there are no partial results
        const onMessage = (message: Message) => {
          if (message.type === "transcript" && message.transcriptType === "final") {
            const newMessage = { role: message.role, content: message.transcript };
            setMessages((prev) => [...prev, newMessage]);
          }
        };
    
        // Triggers once when the speaker starts speaking
        const onSpeechStart = () => {
          console.log("speech start");
          setIsSpeaking(true);
        };
    
        // Triggers once when the speaker ends speaking
        const onSpeechEnd = () => {
          console.log("speech end");
          setIsSpeaking(false);
        };
    
        // Triggered when something goes wrong in the voice engine
        const onError = (error: Error) => {
          console.log("Error:", error);
        };
    
        // Vapi events
        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);
    
        // Removes them once they are done to avoid memory leaks
        return () => {
          vapi.off("call-start", onCallStart);
          vapi.off("call-end", onCallEnd);
          vapi.off("message", onMessage);
          vapi.off("speech-start", onSpeechStart);
          vapi.off("speech-end", onSpeechEnd);
          vapi.off("error", onError);
        };
      }, []);

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log('Generate feedback here.');

        // Todo: Create a server action that generates feedback
        const { success, id} = {
            success: true,
            id: 'feedback-id'
        }

        if(success && id) {
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            console.log('Error saving feedback');
            router.push('/');
        }
    }

    useEffect(() => {
        if(callStatus  === CallStatus.FINISHED) {
            if(type === 'generate') {
                router.push('/')
            } else {
                handleGenerateFeedback(messages);
            }
        }
        if(callStatus  === CallStatus.FINISHED) router.push('/');
    }, [messages, callStatus, type, userId]);

    // Handle once a call starts
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        if(type === 'generate') {
            // Starts the ai vapi workflow session and sends the custom input variables
            await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                variableValues: {
                    username: userName,
                    userid: userId
                }
            })
        } else {
            let formattedQuestions = '';
            if(questions) {
                formattedQuestions = questions
                    .map((question) => `-${questions}`)
                    .join('\n');
            }

            await vapi.start(interviewer, {
                variableValues: {
                    questions: formattedQuestions
                }
            })
        }
    }
    
    // Handle once a call ends
    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    }

    const latestMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
        <div className='call-view'>
            <div className='card-interviewer'>
                <div className='avatar'>
                    <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover" />
                    {isSpeaking && <span className='animate-speak'/>}
                </div>
                <h3>AI Interviewer</h3>
            </div>
            <div className="card-border">
                <div className='card-content'>
                    <Image src="/user-avatar.png" alt="user avatar" width={540} height={540} className="rounded-full object-cover size-[120px]" />
                    <h3>{userName}</h3>
                </div>
            </div>
        </div>
        {messages.length > 0 && (
            <div className='transcript-border'>
                <div className='transcript'>
                    <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                        {latestMessage}
                    </p>
                </div>    
            </div>    
        )}
        <div className='w-full flex justify-center'>
            {callStatus !== "ACTIVE" ? (
                <button className='relative btn-call' onClick={handleCall}>
                    <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== 'CONNECTING' && 'hidden')} />
                    <span>
                        {isCallInactiveOrFinished ? 'Call' : '...'}
                    </span>
                </button>
            ) : (
                <button className='btn-disconnect' onClick={handleDisconnect}>
                    End
                </button>
            )}
        </div>
    </>
  );
};

export default Agent;