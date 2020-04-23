FROM buildpack-deps

# Create dev user
RUN \
  groupadd --gid 1000 dev && \
  useradd --uid 1000 --gid dev --shell /usr/bin/zsh --create-home dev && \
  apt-get update && \
  apt-get install -y sudo && \
  adduser dev sudo && \
  echo "dev ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/dev
USER dev
WORKDIR /home/dev

# Install zsh
RUN \
  sudo apt-get update && \
  sudo apt-get install -y zsh && \
  (wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh || true) && \
  git clone https://github.com/tarjoilija/zgen.git ~/.zgen && \
  echo 'ZSH_THEME="robbyrussell"\nsource ~/.zgen/zgen.zsh' > /home/dev/.zshrc
SHELL ["/usr/bin/zsh", "-ic"]

# Install oh-my-zsh plugins
RUN \
  zgen oh-my-zsh && \
  zgen oh-my-zsh plugins/git && \
  zgen load unixorn/warhol.plugin.zsh && \
  zgen load zsh-users/zsh-syntax-highlighting && \
  zgen load lukechilds/zsh-nvm && \
  zgen save

# Install node
COPY .nvmrc /home/dev/.nvmrc
RUN nvm i

WORKDIR /workspace

CMD ["zsh", "-i"]
