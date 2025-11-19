"use server";

import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });

    try {
      if (response) {
        await inngest.send({
          name: "app/user.created",
          data: {
            email,
            name: fullName,
            country,
            investmentGoals,
            riskTolerance,
            preferredIndustry,
          },
        });
      }
    } catch (emailError) {
      console.warn("Email failed, but signup ok:", emailError);
    }

    return { success: true, data: response };
  } catch (error) {
    console.log("Sign up failed", error);
    return { success: false, error: "Sign up failed" };
  }
};
