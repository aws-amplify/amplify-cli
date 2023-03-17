FROM cimg/node:18.14
RUN sudo npm install -g npm@9
RUN npm -v
WORKDIR /tmp
RUN sudo apt-get update
RUN sudo apt-get install -y \
  xdg-utils \
  libatk-bridge2.0-0 \
  libgtk-3.0 \
  libasound2 \
  lsof \
  sudo \
  tcl \
  expect \
  zip \
  lsof \
  jq \
  groff \
  less \
  tree \
  nano

# Install NodeJS tools
RUN mkdir /home/circleci/.npm-global
RUN mkdir /home/circleci/.npm-global/lib
RUN sudo npm install -g create-react-app

# Install Python
RUN sudo add-apt-repository ppa:deadsnakes/ppa -y
RUN sudo sudo apt-get update
RUN sudo apt-get install -y \
  python2 \
  libpython2-dev \
  python3.8 \
  python3.8-distutils \
  python3-pip \
  libpython3-dev

RUN sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1
RUN python3 --version
RUN pip3 --version
RUN which python3
RUN pip3 install --user pipenv

# Install AWS CLI
RUN sudo pip install awscli

# Install Java
WORKDIR /tmp
RUN curl -O https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz
RUN tar zxvf openjdk-11.0.2_linux-x64_bin.tar.gz
RUN sudo mv jdk-11.0.2 /usr/local
ENV PATH=${PATH}:/usr/local/jdk-11.0.2/bin
RUN rm openjdk-11.0.2_linux-x64_bin.tar.gz

# Install Gradle
WORKDIR /tmp
RUN wget https://services.gradle.org/distributions/gradle-6.3-bin.zip -P /tmp
RUN sudo unzip -d /opt/gradle /tmp/gradle-*.zip
ENV GRADLE_HOME=/opt/gradle/gradle-6.3
ENV PATH=${PATH}:/opt/gradle/gradle-6.3/bin
RUN rm /tmp/gradle-*.zip

# Install Go
WORKDIR /tmp
RUN curl -O https://dl.google.com/go/go1.14.1.linux-amd64.tar.gz
RUN sudo tar -C /usr/local -xzf go1.14.1.linux-amd64.tar.gz
ENV PATH=${PATH}:/usr/local/go/bin
RUN rm go1.14.1.linux-amd64.tar.gz

#Install .Net
RUN sudo apt-get install -y dotnet-sdk-6.0
RUN sudo dotnet --list-sdks
RUN dotnet tool install -g amazon.lambda.tools
RUN dotnet tool install -g amazon.lambda.testtool-6.0
ENV PATH=${PATH}:/home/circleci/.dotnet/tools
