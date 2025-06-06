import '../main2.css';
import { Outlet } from "react-router-dom";

const HomeworkLayout = () => {
  return (
    <>
    <div>
        <Outlet />
    </div>
    </>
  );
};

export default HomeworkLayout;
