# Updated Logging for Resume Upload & AI Processing

I’ve added comprehensive console logs to the backend so you can see every step of a resume upload:

1.  **/upload route** – logs when a request arrives.
2.  **Raw text extraction** – prints the PDF/DOCX/plain text content.
3.  **Gemini call** – shows that the request is sent and when the response arrives.
4.  **Extracted data** – outputs the full JSON parsed by Gemini.

With these logs you should be able to trace the entirety of the upload pipeline in the backend console. If you still don’t see anything, ensure the backend process is running and that you’re looking at the correct terminal window.