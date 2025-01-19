import { todoValidationSchema } from "../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { useFormik } from "formik";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import PropTypes from "prop-types";
import SaveIcon from "@mui/icons-material/Save";
import TextField from "@mui/material/TextField";

const Todo = ({ todo, updateTodo, deleteTodo }) => {
  const { user } = useAuth();

  const formik = useFormik({
    initialValues: {
      todo: todo.task,
    },
    validationSchema: todoValidationSchema,
    onSubmit: (values) => {
      updateTodo(todo.id, values.todo);
    },
  });

  const helperText =
    formik.touched.todo && formik.errors.todo
      ? formik.errors.todo
      : "Todo task details";

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        fullWidth
        id="todo"
        name="todo"
        label="Todo Task"
        disabled={todo.user_id !== user?.id}
        value={formik.values.todo}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.todo && Boolean(formik.errors.todo)}
        helperText={helperText}
        size="small"
      />

      <IconButton
        aria-label="save"
        disabled={todo.user_id !== user?.id}
        type="submit"
      >
        <SaveIcon />
      </IconButton>

      <IconButton
        aria-label="delete"
        onClick={() => deleteTodo(todo.id)}
        disabled={todo.user_id !== user?.id}
      >
        <DeleteIcon />
      </IconButton>
    </form>
  );
};

Todo.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    task: PropTypes.string.isRequired,
    user_id: PropTypes.string.isRequired,
  }).isRequired,
  updateTodo: PropTypes.func.isRequired,
  deleteTodo: PropTypes.func.isRequired,
};

export default Todo;
