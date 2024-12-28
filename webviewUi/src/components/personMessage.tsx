interface MessageProps {
  message: string;
  alias?: string;
}

export const UserMessage: React.FC<MessageProps> = ({ message, alias }) => {
  return (
    <div className="message-container">
      <div className="avatar-container">
        <div className="avatar">{alias}</div>
      </div>
      <div className="message-content">{message}</div>
    </div>
  );
};