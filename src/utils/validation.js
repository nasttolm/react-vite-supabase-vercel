import * as yup from "yup";

const todoValidationSchema = yup.object({
  todo: yup
    .string("Enter your todo")
    .min(3, "Mininum 3 characters")
    .required("Todo is required"),
});

export { todoValidationSchema };
