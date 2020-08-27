
# Get to the root of this project
cd "$( dirname "${BASH_SOURCE[0]}" )"
cd ..

# The workflow has already pulled, but just to be sure..
git pull

# Sometimes there is a build error and node_modules needs to be wiped and replaced
rm -rf node_modules

# Get all deps.
yarn

# Runs `next build`, as defined in /package.json[scripts][build]
yarn build

# Restart the production service with systemd
systemctl restart aven.sky