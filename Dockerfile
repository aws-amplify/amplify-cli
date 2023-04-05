FROM cimg/node:18.14
RUN sudo npm install -g npm@9 && \
    npm -v
WORKDIR /tmp
RUN sudo apt-get update && \
    sudo apt-get install -y \
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
RUN mkdir /home/circleci/.npm-global && \
    mkdir /home/circleci/.npm-global/lib && \
    sudo npm install -g create-react-app

# Install Cypress dependencies
RUN sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

# Install Python
WORKDIR /tmp
RUN sudo apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev curl && \
    curl -O https://www.python.org/ftp/python/3.8.16/Python-3.8.16.tar.xz && \
    sudo tar -C /usr/local -xf Python-3.8.16.tar.xz && \
    sudo rm Python-3.8.16.tar.xz
WORKDIR /usr/local/Python-3.8.16
RUN sudo ./configure && \
    sudo make -j 4 && \
    sudo make altinstall && \
    sudo curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    sudo python3.8 get-pip.py && \
    sudo update-alternatives --install /usr/bin/python3 python3 /usr/local/bin/python3.8 1 && \
    pip3 install --user pipenv && \
    python3 --version && \
    virtualenv --version

# Install AWS CLI
RUN sudo pip install awscli

# Put Node.js PKG binaries in cache location
ARG PKG_AWS_ACCESS_KEY
ARG PKG_AWS_SECRET_ACCESS_KEY
ARG PKG_AWS_SESSION_TOKEN
ARG AWS_REGION
RUN aws configure --profile=pkg-binaries-fetcher set aws_access_key_id $PKG_AWS_ACCESS_KEY && \
  aws configure --profile=pkg-binaries-fetcher set aws_secret_access_key $PKG_AWS_SECRET_ACCESS_KEY  && \
  aws configure --profile=pkg-binaries-fetcher set aws_session_token $PKG_AWS_SESSION_TOKEN
ENV binaries_bucket_name="amplify-cli-pkg-fetch-nodejs-binaries"
ENV binaries_tag="v3.4"
ENV fourteen_version="14.21.3"
ENV eighteen_version="18.15.0"
ENV linux_arm_14_binary_filename="node-v$fourteen_version-linux-arm64"
ENV linux_x64_14_binary_filename="node-v$fourteen_version-linux-x64"
ENV win_arm_14_binary_filename="node-v$fourteen_version-win-arm64"
ENV win_x64_14_binary_filename="node-v$fourteen_version-win-x64"
ENV mac_x64_14_binary_filename="node-v$fourteen_version-macos-x64"
ENV linux_arm_18_binary_filename="node-v$eighteen_version-linux-arm64"
ENV linux_x64_18_binary_filename="node-v$eighteen_version-linux-x64"
ENV win_arm_18_binary_filename="node-v$eighteen_version-win-arm64"
ENV win_x64_18_binary_filename="node-v$eighteen_version-win-x64"
ENV mac_x64_18_binary_filename="node-v$eighteen_version-macos-x64"
ENV linux_arm_14_binary_filename_fetched="fetched-v$fourteen_version-linux-arm64"
ENV linux_x64_14_binary_filename_fetched="fetched-v$fourteen_version-linux-x64"
ENV win_arm_14_binary_filename_fetched="fetched-v$fourteen_version-win-arm64"
ENV win_x64_14_binary_filename_fetched="fetched-v$fourteen_version-win-x64"
ENV mac_x64_14_binary_filename_fetched="fetched-v$fourteen_version-macos-x64"
ENV linux_arm_18_binary_filename_fetched="fetched-v$eighteen_version-linux-arm64"
ENV linux_x64_18_binary_filename_fetched="fetched-v$eighteen_version-linux-x64"
ENV win_arm_18_binary_filename_fetched="fetched-v$eighteen_version-win-arm64"
ENV win_x64_18_binary_filename_fetched="fetched-v$eighteen_version-win-x64"
ENV mac_x64_18_binary_filename_fetched="fetched-v$eighteen_version-macos-x64"
RUN mkdir -p ~/.pkg-cache/$binaries_tag && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$linux_arm_14_binary_filename ~/.pkg-cache/$binaries_tag/$linux_arm_14_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$linux_x64_14_binary_filename ~/.pkg-cache/$binaries_tag/$linux_x64_14_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$win_arm_14_binary_filename ~/.pkg-cache/$binaries_tag/$win_arm_14_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$win_x64_14_binary_filename ~/.pkg-cache/$binaries_tag/$win_x64_14_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$mac_x64_14_binary_filename ~/.pkg-cache/$binaries_tag/$mac_x64_14_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$linux_arm_18_binary_filename ~/.pkg-cache/$binaries_tag/$linux_arm_18_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$linux_x64_18_binary_filename ~/.pkg-cache/$binaries_tag/$linux_x64_18_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$win_arm_18_binary_filename ~/.pkg-cache/$binaries_tag/$win_arm_18_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$win_x64_18_binary_filename ~/.pkg-cache/$binaries_tag/$win_x64_18_binary_filename_fetched && \
  aws --profile=pkg-binaries-fetcher --region $AWS_REGION s3 cp s3://$binaries_bucket_name/$binaries_tag/$mac_x64_18_binary_filename ~/.pkg-cache/$binaries_tag/$mac_x64_18_binary_filename_fetched && \
  ls ~/.pkg-cache/$binaries_tag

# Install Java
WORKDIR /tmp
RUN curl -O https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz && \
    tar zxvf openjdk-11.0.2_linux-x64_bin.tar.gz && \
    sudo mv jdk-11.0.2 /usr/local && \
    rm openjdk-11.0.2_linux-x64_bin.tar.gz
ENV PATH=${PATH}:/usr/local/jdk-11.0.2/bin

# Install Gradle
WORKDIR /tmp
RUN wget https://services.gradle.org/distributions/gradle-6.3-bin.zip -P /tmp && \
    sudo unzip -d /opt/gradle /tmp/gradle-*.zip && \
    rm /tmp/gradle-*.zip
ENV GRADLE_HOME=/opt/gradle/gradle-6.3
ENV PATH=${PATH}:/opt/gradle/gradle-6.3/bin

# Install Go
WORKDIR /tmp
RUN curl -O https://dl.google.com/go/go1.14.1.linux-amd64.tar.gz && \
    sudo tar -C /usr/local -xzf go1.14.1.linux-amd64.tar.gz && \
    rm go1.14.1.linux-amd64.tar.gz
ENV PATH=${PATH}:/usr/local/go/bin

#Install .Net
RUN sudo apt-get install -y dotnet-sdk-6.0 && \
    sudo dotnet --list-sdks && \
    dotnet tool install -g amazon.lambda.tools && \
    dotnet tool install -g amazon.lambda.testtool-6.0
ENV PATH=${PATH}:/home/circleci/.dotnet/tools
