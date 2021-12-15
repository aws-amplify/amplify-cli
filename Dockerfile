FROM circleci/node:14
RUN sudo npm install -g npm@7
RUN npm -v
WORKDIR /tmp
RUN sudo apt-get update && sudo apt-get install -y \
  xdg-utils

# Install Java
WORKDIR /tmp
RUN curl -O https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz
RUN tar zxvf openjdk-11.0.2_linux-x64_bin.tar.gz
RUN sudo mv jdk-11.0.2 /usr/local
ENV PATH=${PATH}:/usr/local/jdk-11.0.2/bin

# Install Gradle
WORKDIR /tmp
RUN wget https://services.gradle.org/distributions/gradle-6.3-bin.zip -P /tmp
RUN sudo unzip -d /opt/gradle /tmp/gradle-*.zip
ENV GRADLE_HOME=/opt/gradle/gradle-6.3
ENV PATH=${PATH}:/opt/gradle/gradle-6.3/bin

# Install Go
WORKDIR /tmp
RUN curl -O https://dl.google.com/go/go1.14.1.linux-amd64.tar.gz
RUN sudo tar -C /usr/local -xzf go1.14.1.linux-amd64.tar.gz
ENV PATH=${PATH}:/usr/local/go/bin

# Install Python
WORKDIR /tmp
RUN sudo apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev curl
RUN curl -O https://www.python.org/ftp/python/3.8.2/Python-3.8.2.tar.xz
RUN sudo tar -C /usr/local -xf Python-3.8.2.tar.xz
WORKDIR /usr/local/Python-3.8.2
RUN sudo ./configure
RUN sudo make -j 4
RUN sudo make install
RUN sudo apt install python3-pip
RUN pip3 install --user pipenv
RUN python3 --version

#Install .Net
WORKDIR /tmp
RUN sudo apt-get install apt-transport-https ca-certificates
RUN wget -O- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.asc.gpg
RUN sudo mv microsoft.asc.gpg /etc/apt/trusted.gpg.d/
RUN wget https://packages.microsoft.com/config/debian/9/prod.list
RUN sudo mv prod.list /etc/apt/sources.list.d/microsoft-prod.list
RUN sudo chown root:root /etc/apt/trusted.gpg.d/microsoft.asc.gpg
RUN sudo chown root:root /etc/apt/sources.list.d/microsoft-prod.list

RUN sudo apt-get update
RUN sudo apt-get install apt-transport-https
RUN sudo apt-get update
RUN sudo apt-get install dotnet-sdk-3.1
RUN dotnet --version
RUN dotnet tool install -g amazon.lambda.tools
RUN dotnet tool install -g amazon.lambda.testtool-3.1
ENV PATH=${PATH}:/home/circleci/.dotnet/tools
