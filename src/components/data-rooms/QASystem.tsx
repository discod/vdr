import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Plus, Send, Lock, Unlock, User, Clock } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { formatDate } from "~/lib/utils";

interface QASystemProps {
  dataRoomId: number;
  userPermissions: {
    canManageQA: boolean;
    canView: boolean;
  };
}

export function QASystem({ dataRoomId, userPermissions }: QASystemProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    context: '',
    isPrivate: false,
  });
  const [answerText, setAnswerText] = useState<{ [key: number]: string }>({});
  const [answerPrivacy, setAnswerPrivacy] = useState<{ [key: number]: boolean }>({});

  const trpc = useTRPC();
  const getQuestions = useQuery(trpc.getQuestions.queryOptions({
    token: localStorage.getItem('auth-token') || '',
    dataRoomId,
  }));
  const createQuestion = useMutation(trpc.createQuestion.mutationOptions());
  const answerQuestion = useMutation(trpc.answerQuestion.mutationOptions());

  useEffect(() => {
    if (getQuestions.data) {
      setQuestions(getQuestions.data);
    }
  }, [getQuestions.data]);

  const handleSubmitQuestion = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token || !newQuestion.question.trim()) return;

    try {
      await createQuestion.mutateAsync({
        token,
        dataRoomId,
        question: newQuestion.question,
        context: newQuestion.context,
        isPrivate: newQuestion.isPrivate,
      });

      setNewQuestion({ question: '', context: '', isPrivate: false });
      setShowNewQuestion(false);
      getQuestions.refetch();
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  const handleSubmitAnswer = async (questionId: number) => {
    const token = localStorage.getItem('auth-token');
    const answer = answerText[questionId];
    if (!token || !answer?.trim()) return;

    try {
      await answerQuestion.mutateAsync({
        token,
        questionId,
        answer,
        isPrivate: answerPrivacy[questionId] || false,
      });

      setAnswerText(prev => ({ ...prev, [questionId]: '' }));
      setAnswerPrivacy(prev => ({ ...prev, [questionId]: false }));
      getQuestions.refetch();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800';
      case 'ANSWERED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (getQuestions.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Q&A ({questions.length})
          </h3>
        </div>
        <Button
          onClick={() => setShowNewQuestion(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ask Question
        </Button>
      </div>

      {/* New Question Form */}
      {showNewQuestion && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Ask a Question</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
              </label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What would you like to know?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context (Optional)
              </label>
              <textarea
                value={newQuestion.context}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, context: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide additional context or reference specific documents..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="question-private"
                checked={newQuestion.isPrivate}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="question-private" className="text-sm text-gray-700">
                Make this question private
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSubmitQuestion}
                disabled={!newQuestion.question.trim() || createQuestion.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createQuestion.isLoading ? 'Submitting...' : 'Submit Question'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNewQuestion(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600">Be the first to ask a question!</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {question.author.firstName} {question.author.lastName}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(question.createdAt)}</span>
                      {question.isPrivate && (
                        <div className="flex items-center space-x-1">
                          <Lock className="h-3 w-3" />
                          <span>Private</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                  {question.status}
                </span>
              </div>

              {/* Question Content */}
              <div className="mb-4">
                <p className="text-gray-900 mb-2">{question.question}</p>
                {question.context && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {question.context}
                  </p>
                )}
              </div>

              {/* Answers */}
              {question.answers.length > 0 && (
                <div className="space-y-3 mb-4">
                  {question.answers.map((answer: any) => (
                    <div key={answer.id} className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {answer.author.firstName} {answer.author.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(answer.createdAt)}
                        </span>
                        {answer.isPrivate && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Lock className="h-3 w-3" />
                            <span>Private</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-900">{answer.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {userPermissions.canManageQA && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-3">
                    <textarea
                      value={answerText[question.id] || ''}
                      onChange={(e) => setAnswerText(prev => ({ ...prev, [question.id]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Write your answer..."
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`answer-private-${question.id}`}
                          checked={answerPrivacy[question.id] || false}
                          onChange={(e) => setAnswerPrivacy(prev => ({ ...prev, [question.id]: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`answer-private-${question.id}`} className="text-sm text-gray-700">
                          Make this answer private
                        </label>
                      </div>
                      <Button
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={!answerText[question.id]?.trim() || answerQuestion.isLoading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Answer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
