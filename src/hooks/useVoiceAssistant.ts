import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface VoiceAssistantState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useVoiceAssistant() {
  const [state, setState] = useState<VoiceAssistantState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: '',
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Text-to-Speech
  const speak = useCallback(async (text: string, voiceId?: string): Promise<void> => {
    if (!text || text.trim().length === 0) return;

    setState(prev => ({ ...prev, isSpeaking: true, error: null }));

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };
        audio.onerror = (e) => {
          setState(prev => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(new Error('Audio playback failed'));
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('TTS error:', error);
      setState(prev => ({ 
        ...prev, 
        isSpeaking: false, 
        error: error instanceof Error ? error.message : 'Speech generation failed' 
      }));
      throw error;
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  // Start listening
  const startListening = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isListening: true, transcript: '', error: null }));
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      console.error('Microphone error:', error);
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: 'Microphone access denied' 
      }));
      toast.error('Please allow microphone access to use voice features');
    }
  }, []);

  // Stop listening and transcribe
  const stopListening = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setState(prev => ({ ...prev, isListening: false }));
        resolve('');
        return;
      }

      mediaRecorder.onstop = async () => {
        setState(prev => ({ ...prev, isListening: false, isProcessing: true }));

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              
              const response = await fetch(
                `${SUPABASE_URL}/functions/v1/voice-to-text`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                  },
                  body: JSON.stringify({ audio: base64Audio }),
                }
              );

              if (!response.ok) {
                throw new Error('Transcription failed');
              }

              const { text } = await response.json();
              setState(prev => ({ 
                ...prev, 
                isProcessing: false, 
                transcript: text || '' 
              }));
              resolve(text || '');
            } catch (error) {
              console.error('Transcription error:', error);
              setState(prev => ({ 
                ...prev, 
                isProcessing: false, 
                error: 'Transcription failed' 
              }));
              reject(error);
            }
          };
        } catch (error) {
          setState(prev => ({ ...prev, isProcessing: false }));
          reject(error);
        }

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.stop();
    });
  }, []);

  // Cancel listening
  const cancelListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
  }, []);

  return {
    ...state,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    cancelListening,
  };
}
