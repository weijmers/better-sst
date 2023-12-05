import Link from "next/link";
import { IconType } from "react-icons";
import { BsPlus, BsPlayFill, BsFillLightningFill, BsGearFill } from "react-icons/bs";
import { IoIosFootball } from "react-icons/io";
import { FaPlay } from "react-icons/fa";



const SideBar = () => {
  return (
    <nav className="fixed top-0 left-0 h-screen w-16 flex flex-col
    bg-white shadow-lg">
      <SideBarIcon href="/" icon={<IoIosFootball size="28" />} text="Fixtures" />
      <SideBarIcon href="/events" icon={<BsFillLightningFill size="20" />} text="Events" />
      <SideBarIcon href="/settings" icon={<BsGearFill size="22" />} text="Settings" />
    </nav>
  )
}

type SideBarIconProps = {
  icon: React.ReactNode;
  href: string;
  text?: string;
};

const SideBarIcon = ({ icon, href, text }: SideBarIconProps) => (
  <Link href={href} className="sidebar-icon group">
    {icon}
    {text && <span className="sidebar-tooltip group-hover:scale-100">
      {text}
    </span>}
  </Link>
);


const Divider = () => <hr className="sidebar-hr" />;

export default SideBar;