// 3hr 9min

import { z } from "zod";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { insertAccountSchema } from "@/db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = insertAccountSchema
  .pick({ name: true })
  .refine((data) => data.name.trim().length > 0, {
    message: "Name is required and cannot be empty",
    path: ["name"],
  }); // we're are only requesting the name field on this modified schema defination for the account insertion.

type FormValues = z.infer<typeof formSchema>;

type Props = {
  id?: string; // optional incase we're editing,
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
};

export const AccountForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
}: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? { name: "" },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 pt-4"
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="e.g. Cash, Bank, Credit Card"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" disabled={disabled}>
          {id ? "Save changes" : "Create account"}
        </Button>

        {!!id && (
          <Button
            type="button" // added it as a type of button so it dosen't submit the form
            disabled={disabled}
            onClick={handleDelete}
            className="w-full"
            variant="outline"
          >
            <Trash className="size-4 mr-2" />
            Delete account
          </Button>
        )}
      </form>
    </Form>
  );
};

// Which Should You Use?
// Use z.input if you’re working with the data before validation (e.g., form input fields or raw API data). Use this type for your form’s initial values or the data submitted by the user (e.g., from a <form> or React state)
// Use z.infer if you’re working with the data after validation (e.g., in a submit handler or database operation). Use this type for the data you work with after calling formSchema.parse(), where age has been transformed into a number (e.g., 25).

// For most form-related use cases (e.g., with libraries like React Hook Form), you’ll often use z.infer because it represents the final, validated
// shape of the data you’ll submit or process. However, if you’re explicitly typing the raw input (e.g., uncontrolled form fields), z.input might be more appropriate.
