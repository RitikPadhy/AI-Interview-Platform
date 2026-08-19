# Things it should be able to do

We host this locally so whatever you need is local, we need to do it all from here. Reason being i dont have claude api credits. So everything through claude here locally either terminal or something. So we hit Run from here itself locally. 

1. Mock Interviews
    - Asks three categories - Data Science, AI & Machine Learning OR Quantitative Finance OR Software Engineering
    - Once selected, you ask which round in the interview are in for a little bit more context. 
    - Once selected, you ask for job description -> it prepares either online assessment or a mock interview for me. 
    You can use the existing repo to refactor the changes. 

2. Refactoring resumes based on job description
    - I put the job description. 
    - It needs to find the most important keywords required to be added in my resume for the job description. I have given my resume as well. 
    - It should not make changes, it just gives suggestions on what to change. 
    - Also should not sound AI generated at all. 

3. Refactoring cover letter based on job description
    - Same like the second i would say but lesgo with this prompt.
    - "Act as an expert technical recruiter. Write a short, punchy, 150-word cover letter for my application to the [Job Title] role at [Company Name].My Resume Context: [Paste 2 relevant bullet points, e.g., ClearTax AWS/PostgreSQL work]  Target Job Description: [Paste JD text]Formatting Rules:Paragraph 1 (The Hook): Start immediately with how my experience directly aligns with their core technical stack. Do NOT write an intro sentence like 'I am writing to apply for...'.Paragraph 2 (The Proof): Highlight 1 real engineering project from my resume, mentioning specific metrics (e.g., handling 12,000+ records or AWS Athena pipelines).  Paragraph 3 (The Close): One sentence explaining why their specific product or data stack excites me, followed by a low-friction call to action.Keep the entire output under 175 words. Use simple, direct human language—no buzzwords like 'passionate', 'synergy', or 'spearheaded'."*

4. You need to tell me who might be the right people to message to get this message out there. 
    - I put the job description and my resume
    - Then you tell me by doing google search or going over linkedin. 


You can refactor the entire website, remove stuff which are not all required. You have everything you need. Push the code after you are done. 
Remember we are not doing it like from some terminal, these things i want them to happen over ui, so easier and faster. So we need ui which I will run from the terminal. 

My entire aim is for get an interview somehow and crack the job so. 