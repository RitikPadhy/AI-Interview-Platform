"use client"
 
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === 'sign-up' ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  })
}

const AuthForm = ({ type } : { type: FormType }) => {
  const router = useRouter();
  const formSchema = authFormSchema(type);
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try{
      if(type === 'sign-up')
      {
        const { name, email, password} = values;
        // Create a new user in firebase authenication, client side
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Calls the sign up function to check if the user alreay exists in the firestore, if no, add him there, server side
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result?.success) {
          toast.error(result?.message);
          return;
        }

        toast.success('Account created successfully. Please sign in.');
        router.push('/sign-in');
      }
      else 
      {
        const { email, password } = values;
        // Sign In into the Firebase authentication, and helps retrieving the id token for that sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const idToken = await userCredential.user.getIdToken();

        if(!idToken)
        {
          toast.error('Sign in failed');
          return;
        }

        // The idToken will help in creating a session cookie for the signed-in user
        await signIn({
          email, idToken
        })

        toast.success('Sign in successfully.');
        router.push('/');
      }
    } catch(error){
      console.log(error);
      toast.error(`There was an error: ${error}`)
    }
    
  }

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38}/>
          <h2 className="text-primary-100">PrepWise</h2>
        </div>
        <h3>Practice job interview with AI</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8 mt-4 form">
            {!isSignIn && (
              <FormField control={form.control} name="name" label="Name" placeholder="Your Name" />
            )}
            <FormField control={form.control} name="email" label="Email" placeholder="Your email address" type="email" />
            <FormField control={form.control} name="password" label="Password" placeholder="Enter your password" type="password" />
            <Button className = "btn" type="submit">{isSignIn ? 'Sign in' : 'Create an account'}</Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? 'No account yet?': 'Have an account already?'}
          <Link href={!isSignIn ? '/sign-in' : '/sign-up'} className="font-bold text-user-primary ml-1">
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
