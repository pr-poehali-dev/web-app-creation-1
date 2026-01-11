import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI_CHAT_URL = 'https://functions.poehali.dev/2edb4509-5831-426f-a93b-14e50c4b023f';

const EXAMPLE_PROMPTS = [
  'Напиши текст приветствия для главной страницы',
  'Придумай описание для категории "Строительные материалы"',
  'Как улучшить SEO на сайте?',
  'Напиши правила размещения объявлений',
];

export default function AdminAIChat({ isAuthenticated, onLogout }: { isAuthenticated: boolean; onLogout: () => void }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я AI-ассистент для управления сайтом ЕРТТП. Могу помочь с:\n\n• Генерацией текстов для страниц\n• Созданием описаний товаров/услуг\n• Советами по SEO и маркетингу\n• Правками и улучшением контента\n• Ответами на вопросы о функционале\n\nЗадавайте любые вопросы!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiMessages = messages
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      apiMessages.push({
        role: 'user',
        content: content.trim()
      });

      const response = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сервера');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось получить ответ'}. Проверьте, что API ключ OpenAI добавлен в секреты проекта.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Чат очищен. Чем могу помочь?',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/panel')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Icon name="ArrowLeft" size={24} />
            </button>
            <h1 className="text-3xl font-bold">AI-Ассистент</h1>
          </div>
          <Button
            onClick={clearChat}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Icon name="Trash2" size={16} />
            Очистить
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-4 flex-1">
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Bot" size={20} className="text-primary" />
                  Чат с AI
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-[500px]">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Напишите сообщение..."
                      className="flex-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Примеры запросов</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="w-full text-left text-sm p-3 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Возможности</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                  <span>Генерация текстов</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                  <span>SEO советы</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                  <span>Правки контента</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                  <span>Ответы на вопросы</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
