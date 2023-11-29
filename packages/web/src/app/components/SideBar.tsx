
import { IconType } from 'react-icons';
import { BsPlus, BsPlayFill, BsFillLightningFill, BsGearFill } from 'react-icons/bs';
import { IoIosFootball } from "react-icons/io";
import { FaPlay } from "react-icons/fa";


const SideBar = () => {
  return (
  <nav className="fixed top-0 left-0 h-screen w-16 flex flex-col
  bg-white dark:bg-gray-900 shadow-lg">
    <SideBarIcon icon={<IoIosFootball size="28" />} />
    <Divider />
    <SideBarIcon icon={<BsPlus size="32" />} />
    <SideBarIcon icon={<BsFillLightningFill size="20" />} />
    <Divider />
    <SideBarIcon icon={<BsGearFill size="22" />} />
  </nav>
  )
}

type SideBarIconProps = {
  icon: React.ReactNode;
  text?: string;
};

const SideBarIcon = ({ icon, text = 'tooltip 💡' }: SideBarIconProps) => (
  <div className="sidebar-icon group">
    {icon}
    <span className="sidebar-tooltip group-hover:scale-100">
      {text}
    </span>
  </div>
);


const Divider = () => <hr className="sidebar-hr" />;

export default SideBar;