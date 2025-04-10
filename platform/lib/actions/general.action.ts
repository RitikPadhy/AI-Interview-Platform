"use server";

import { db } from "@/firebase/admin";

// To return the list of intervies from firestore database
export async function getInterviewsByUserId( userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();   

    return interviews.docs.map((doc) => ({
        id:doc.id,
        ... doc.data()
    })) as Interview[];
}

// To return the list of latest intervies taken by others from firestore database
export async function getLatestInterviews( params: GetLatestInterviewsParams ): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();   

    return interviews.docs.map((doc) => ({
        id:doc.id,
        ... doc.data()
    })) as Interview[];
}

export async function getInterviewsById( id: string): Promise<Interview | null> {
    const interviews = await db
        .collection('interviews')
        .doc(id)
        .get();   

    return interviews.data() as Interview | null;
}