import React, { useState } from 'react';
import { MessageSquare, Send, Shield, Lock, Scale, CheckCheck, Clock, UserCheck, ArrowRightLeft } from './icons';
import { ChatInteraction, LegalProfessional } from '../types';
import { lawyerSelectStore } from '../services/lawyerSelectStore';
import { UserPersona } from './Navbar';

interface ChatMessengerProps {
  chatInteractions: ChatInteraction[];
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
  userPersona: UserPersona;
  setUserPersona: (persona: UserPersona) => void;
  onGoToMatchmaker: () => void;
}

export const ChatMessenger: React.FC<ChatMessengerProps> = ({
  chatInteractions,
  activeChatId,
  setActiveChatId,
  userPersona,
  setUserPersona,
  onGoToMatchmaker,
}) => {
  const [messageInput, setMessageInput] = useState('');

  const currentChat = chatInteractions.find((c) => c.id === activeChatId) || chatInteractions[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat) return;

    const senderId = userPersona === 'client' ? currentChat.clientId : currentChat.lawyerId;
    const senderRole = userPersona === 'client' ? 'client' : 'legal_professional';
    const senderName = userPersona === 'client' ? currentChat.clientName : currentChat.lawyerName;

    lawyerSelectStore.sendMessage(
      currentChat.id,
      senderId,
      senderRole,
      senderName,
      messageInput
    );

    setMessageInput('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge-rose">
              <MessageSquare size={13} />
              <span>Firebase chat_interactions</span>
            </span>
            <span className="badge-gold">
              <Lock size={12} />
              <span>Restricted Direct Contact</span>
            </span>
          </div>
          <h2 style={{ fontSize: '2rem', color: '#fff' }}>
            Legal Consultation Messenger
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Only clients who explicitly choose to speak to specific lawyers can initiate contact.
          </p>
        </div>

        {/* Perspective toggle inside chat */}
        <div style={{
          background: 'rgba(16, 22, 34, 0.8)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sending message as:</span>
          <strong style={{ fontSize: '0.85rem', color: userPersona === 'client' ? '#60a5fa' : 'var(--gold-light)' }}>
            {userPersona === 'client' ? 'Client View (David K.)' : 'Lawyer View (Elena Vance SC)'}
          </strong>
          <button
            onClick={() => setUserPersona(userPersona === 'client' ? 'lawyer' : 'client')}
            className="btn-ghost"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
          >
            <ArrowRightLeft size={12} />
            <span>Switch Role</span>
          </button>
        </div>
      </div>

      {chatInteractions.length === 0 ? (
        /* Empty State */
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(229, 169, 60, 0.1)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-light)',
            margin: '0 auto 1.25rem',
          }}>
            <Lock size={28} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>
            No Open Chat Interactions Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
            In strict compliance with Lawyer Select security rules, messaging is only opened when a client explicitly selects a specific lawyer from the <strong>AI Matchmaker</strong> or when a lawyer acquires a case lead.
          </p>
          <button onClick={onGoToMatchmaker} className="btn-gold" style={{ padding: '0.7rem 1.5rem' }}>
            <span>Find & Select a Lawyer in AI Matchmaker</span>
          </button>
        </div>
      ) : (
        /* Messenger Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 320px) 1fr',
          gap: '1.25rem',
          minHeight: '620px',
        }}>
          
          {/* Left Panel: Channels List */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', padding: '0.4rem 0.5rem' }}>
              Selected Legal Consultations ({chatInteractions.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }}>
              {chatInteractions.map((chat) => {
                const isSelected = (currentChat && currentChat.id === chat.id);
                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(229, 169, 60, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--border-gold-bright)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                        {chat.lawyerName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)', marginBottom: '0.35rem' }}>
                      {chat.lawyerTitle} • {chat.lawyerFirm}
                    </div>

                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {chat.lastMessageSnippet || 'No messages yet'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active Conversation */}
          {currentChat && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Chat Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(10, 14, 23, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(229, 169, 60, 0.3), rgba(229, 169, 60, 0.05))',
                    border: '1px solid var(--border-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-light)',
                  }}>
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.15rem' }}>
                      {currentChat.lawyerName}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {currentChat.lawyerTitle} • {currentChat.lawyerFirm} • Client: {currentChat.clientName}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge-emerald" style={{ fontSize: '0.72rem' }}>
                    <Shield size={12} />
                    <span>LPP Privileged Channel</span>
                  </span>
                </div>
              </div>

              {/* Message List */}
              <div style={{
                flex: 1,
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxHeight: '440px',
              }}>
                {currentChat.messages.map((msg) => {
                  const isMe = (userPersona === 'client' && msg.senderRole === 'client') ||
                               (userPersona === 'lawyer' && msg.senderRole === 'legal_professional');

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.senderRole === 'client' ? '#60a5fa' : 'var(--gold-light)' }}>
                          {msg.senderName}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{
                        background: isMe
                          ? 'linear-gradient(135deg, rgba(229, 169, 60, 0.22) 0%, rgba(229, 169, 60, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.06)',
                        border: isMe ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        padding: '0.85rem 1.15rem',
                        color: '#fff',
                        fontSize: '0.92rem',
                        lineHeight: 1.5,
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(10, 14, 23, 0.8)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Type confidential message as ${userPersona === 'client' ? 'Client (' + currentChat.clientName + ')' : 'Legal Professional (' + currentChat.lawyerName + ')'}...`}
                  className="input-luxury"
                />
                <button
                  type="submit"
                  className="btn-gold"
                  style={{ padding: '0.75rem 1.3rem' }}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </form>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
