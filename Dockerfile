FROM public.ecr.aws/ubuntu/ubuntu:22.04
RUN npm install -g npm@7
RUN npm -v
WORKDIR /tmp
RUN apt-get update
RUN apt-get install -y \
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
  python \
  python-pip \
  libpython-dev \
  less \
  tree

RUN pip install awscli

# Put Node.js PKG binaries in cache location
ENV PKG_CACHE_PATH=/root/pkg-cache
COPY pkg-cache $PKG_CACHE_PATH
RUN echo $PKG_CACHE_PATH

# Install Java
WORKDIR /tmp
RUN curl -O https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz
RUN tar zxvf openjdk-11.0.2_linux-x64_bin.tar.gz
RUN mv jdk-11.0.2 /usr/local
ENV PATH=${PATH}:/usr/local/jdk-11.0.2/bin

# Install Gradle
WORKDIR /tmp
RUN wget https://services.gradle.org/distributions/gradle-6.3-bin.zip -P /tmp
RUN unzip -d /opt/gradle /tmp/gradle-*.zip
ENV GRADLE_HOME=/opt/gradle/gradle-6.3
ENV PATH=${PATH}:/opt/gradle/gradle-6.3/bin

# Install Go
WORKDIR /tmp
RUN curl -O https://dl.google.com/go/go1.14.1.linux-amd64.tar.gz
RUN tar -C /usr/local -xzf go1.14.1.linux-amd64.tar.gz
ENV PATH=${PATH}:/usr/local/go/bin

# Install Python
WORKDIR /tmp
RUN apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev curl
RUN curl -O https://www.python.org/ftp/python/3.8.2/Python-3.8.2.tar.xz
RUN tar -C /usr/local -xf Python-3.8.2.tar.xz
WORKDIR /usr/local/Python-3.8.2
RUN ./configure
RUN make -j 4
RUN make install
RUN apt install python3-pip
RUN pip3 install --user pipenv
RUN python3 --version

#Install .Net
WORKDIR /tmp
RUN apt-get install apt-transport-https ca-certificates
RUN wget -O- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.asc.gpg
RUN mv microsoft.asc.gpg /etc/apt/trusted.gpg.d/
RUN wget https://packages.microsoft.com/config/debian/9/prod.list
RUN mv prod.list /etc/apt/sources.list.d/microsoft-prod.list
RUN chown root:root /etc/apt/trusted.gpg.d/microsoft.asc.gpg
RUN chown root:root /etc/apt/sources.list.d/microsoft-prod.list

RUN apt-get update
RUN apt-get install apt-transport-https
RUN apt-get update
RUN apt-get install dotnet-sdk-3.1
RUN apt-get install dotnet-sdk-6.0
RUN dotnet --version
RUN dotnet --list-sdks
RUN dotnet tool install -g amazon.lambda.tools
RUN dotnet tool install -g amazon.lambda.testtool-3.1
RUN dotnet tool install -g amazon.lambda.testtool-6.0
ENV PATH=${PATH}:/home/circleci/.dotnet/tools

