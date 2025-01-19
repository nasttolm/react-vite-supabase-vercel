import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";

import { useAuth } from "../hooks/useAuth";

const pages = [
  { pageName: "Home", link: "/", protected: null },
  { pageName: "Sign In", link: "/auth/sign-in", protected: false },
  { pageName: "Sign Up", link: "/auth/sign-up", protected: false },
];

function ResponsiveAppBar() {
  const { session, loading } = useAuth();

  const [anchorElNav, setAnchorElNav] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  if (loading) {
    return null;
  }

  return (
    <AppBar position="static" color="#FFF" elevation={0}>
      <Container>
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((page) => {
                if (
                  page.protected === null ||
                  (page.protected === false && !session) ||
                  (page.protected === true && session)
                ) {
                  return (
                    <MenuItem key={page.pageName} onClick={handleCloseNavMenu}>
                      <Link
                        href={page.link}
                        sx={{
                          textAlign: "center",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {page.pageName}
                      </Link>
                    </MenuItem>
                  );
                }
                return null;
              })}
            </Menu>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => {
              if (
                page.protected === null ||
                (page.protected === false && !session) ||
                (page.protected === true && session)
              ) {
                return (
                  <Button
                    key={page.pageName}
                    onClick={handleCloseNavMenu}
                    sx={{ my: 2, display: "block" }}
                    href={page.link}
                  >
                    {page.pageName}
                  </Button>
                );
              }
              return null;
            })}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
