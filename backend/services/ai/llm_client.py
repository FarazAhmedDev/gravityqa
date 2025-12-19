from typing import Dict, Optional
from config import settings
import os

class LLMClient:
    """Client for LLM APIs (OpenAI, Anthropic)"""
    
    def __init__(self):
        self.provider = settings.DEFAULT_LLM_PROVIDER
        self.model = settings.DEFAULT_MODEL
        self.api_key = None
        
        if self.provider == "openai":
            self.api_key = settings.OPENAI_API_KEY
        elif self.provider == "anthropic":
            self.api_key = settings.ANTHROPIC_API_KEY
    
    async def chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Optional[str]:
        """Get chat completion from LLM"""
        
        if self.provider == "openai":
            return await self._openai_completion(messages, temperature, max_tokens)
        elif self.provider == "anthropic":
            return await self._anthropic_completion(messages, temperature, max_tokens)
        
        return None
    
    async def _openai_completion(self, messages, temperature, max_tokens) -> Optional[str]:
        """OpenAI API completion"""
        try:
            from openai import AsyncOpenAI
            
            client = AsyncOpenAI(api_key=self.api_key)
            
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return None
    
    async def _anthropic_completion(self, messages, temperature, max_tokens) -> Optional[str]:
        """Anthropic API completion"""
        try:
            from anthropic import AsyncAnthropic
            
            client = AsyncAnthropic(api_key=self.api_key)
            
            # Convert messages format
            system_message = ""
            anthropic_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    anthropic_messages.append(msg)
            
            response = await client.messages.create(
                model=self.model,
                system=system_message if system_message else None,
                messages=anthropic_messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return response.content[0].text
        
        except Exception as e:
            print(f"Anthropic API error: {e}")
            return None
    
    async def vision_completion(
        self,
        prompt: str,
        image_base64: str,
        temperature: float = 0.7
    ) -> Optional[str]:
        """Get vision completion from LLM"""
        
        if self.provider == "openai":
            try:
                from openai import AsyncOpenAI
                
                client = AsyncOpenAI(api_key=self.api_key)
                
                response = await client.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    temperature=temperature,
                    max_tokens=2000
                )
                
                return response.choices[0].message.content
            
            except Exception as e:
                print(f"Vision API error: {e}")
                return None
        
        elif self.provider == "anthropic":
            try:
                from anthropic import AsyncAnthropic
                
                client = AsyncAnthropic(api_key=self.api_key)
                
                response = await client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2000,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "image/png",
                                        "data": image_base64
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                )
                
                return response.content[0].text
            
            except Exception as e:
                print(f"Vision API error: {e}")
                return None
        
        return None
