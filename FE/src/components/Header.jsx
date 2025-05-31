import '../Component.css';
const Header = () => {
    return (
              <div className="dashboard-header">
                <div className="search-notify">
                  <input type="text" placeholder="Tìm kiếm" />
                  <i className="fas fa-bell"></i>
                  <img src="avatar2.jpg" alt="avatar" />
                </div>
              </div>
    )
}
export default Header;