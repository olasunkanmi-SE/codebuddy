export const chatCss: string = `
    body {
        margin: 0;
        padding: 0;
        font-family: 'Open Sans', sans-serif;
        background-color: #333;
        color: #eee;
        height: 100%;
    }

    .chat-container {
        height: 100vh;
        max-width: 600px;
        margin: 0 auto;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
    }

    .chat-header {
        background-color: #444;
        color: #fff;
        padding: 10px 20px;
        font-weight: bold;
        text-align: center;
    }

    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        background-color: #222;
        position: relative;
    }

    .chat-message {
        margin-bottom: 20px;
    }

    .chat-message.sender .message-body {
        background-color: #636363;
        color: #fff;
        float: right;
        margin-bottom: 20px;
    }

    .chat-message.bot .message-body {
        background-color: #3b3b3b;
        color: #eee;
    }

    .chat-message .message-body {
        padding: 10px;
        border-radius: 5px;
        display: inline-block;
        max-width: 90%;
        overflow-x: auto;
        position: relative;
    }

    .code-container-wrapper {
        margin-top: 10px;
    }

    .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #333;
        padding: 5px 10px;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        border-bottom: 1px solid #666;
        position: sticky;
        top: 0;
        margin-bottom: -30px;
        z-index: 1;
    }

    .code-header span {
        font-weight: bold;
        color: #fff;
    }

    .code-container {
        overflow-x: auto;
        white-space: pre;
        background-color: #222;
        border-radius: 0 0 5px 5px;
        position: relative;
        margin: 0; 
        padding: 0;
    }

    .copy-button {
        background-color: #636363;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
    }

    .chat-input-container {
        position: sticky;
        top: 500px;
        background-color: #444;
        padding: 10px;
        border-top: 1px solid #666;
        display: flex;
    }

    .chat-input {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 5px;
        margin-right: 10px;
        font-size: 14px;
        background-color: #333;
        color: #eee;
    }

    .chat-send {
        background-color: #636363;
        color: #fff;
        border: none;
        border-radius: 5px;
        padding: 10px 20px;
        cursor: pointer;
        font-size: 14px;
    }

   .scroll-button {
        position: absolute;
        bottom: 50px;
        right: 50%;
        transform: translate(-50%, -50%);
        background-color: #333;
        color: #fff;
        border-style: solid;
        boder-color: white;
        border-radius: 50%;
        font-family: FontAwesome;
        content: "\f078"; 
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-left: auto;
        display: none;
        padding: 13px;
    }

    .chat-container:hover .scroll-button {
        display: flex;
    }
`;
