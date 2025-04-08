'use server';

import { auth, db } from "@/firebase/admin";
import { cookies } from 'next/headers';

const ONE_WEEK = 60*60*24*7;

export async function signUp(params: SignUpParams)
{
    const { uid, name, email } = params;
    try {
        // Get user records by going to the database of the users
        const userRecord = await db.collection('users').doc(uid).get();

        // Check if the user already exists in the database of the users
        if(userRecord.exists) {
            return {
                success: false,
                message: 'User already exists. Please sign in instead.'
            }
        }

        // If not, set the user inside the database
        await db.collection('users').doc(uid).set({
            name, email
        })

        return {
            success: true,
            message: 'Account created successfully. Please sign in.'
        }
    }
    catch(error: any)
    {
        console.error('Error creating an user', error);
        if(error.code === 'auth/email-already-exists') {
            return {
                success: false,
                message: 'This email is already in use.'
            }
        }
        return {
            success: false,
            message: 'Failed to create an account'
        }
    }
}

export async function signIn(params: SignInParams)
{
    const  { email, idToken } = params;

    try {
        // Get all records of the user based on an email
        const userRecord = await auth.getUserByEmail(email);

        // If user record does not exist, the user is only not signed up
        if(!userRecord)
        {
            return {
                success: false,
                message: 'User does not exist. Create an account instead.'
            }
        }

        // Create a session cookie for this isToken
        await setSessionCookie(idToken);
      } 
      catch(e) {
        console.log(e);
        return {
            success: false,
            message: 'Failed to log into an account.'
        }
      }
}

export async function setSessionCookie(idToken: string)
{
    // Fetch the cookie management utility
    const cookieStore = await cookies();

    // Convert short-lived ID token into a long lived session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK*1000,
    })

    // Store the cookie on the client, lifetime is 7 days, prevents JS access, cookie is available on all pages of the website, prevents attacks
    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
    })
}

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();

    // Get session cookie
    const sessionCookie = cookieStore.get('session')?.value;

    if(!sessionCookie) return null;

    try {
        // Verify that the session cookie is valid using the Firebase Admin SDK
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        // Using the UID extract the users records from the users collection in Firestore
        const userRecord = await db. 
            collection('users')
            .doc(decodedClaims.uid)
            .get();

        if(!userRecord.exists) return null;

        // Return the user data from firestore with the document ID
        return {
            ... userRecord.data(),
            id: userRecord.id
        } as User;
    } catch(e) {
        console.log(e);
        return null;
    }
}

// This function will tells us whether an user is looged in or not
export async function isAuthenticated() {
    const user = await getCurrentUser();

    return !!user;
}