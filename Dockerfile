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
RUN sudo add-apt-repository ppa:deadsnakes/ppa -y && \
    sudo sudo apt-get update && \
    sudo apt-get install -y \
  python2 \
  libpython2-dev \
  python3.8 \
  python3.8-distutils \
  python3-pip \
  libpython3-dev

RUN sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1 && \
    python3 --version && \
    pip3 --version && \
    which python3 && \
    pip3 install --user pipenv

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
ENV binaries_bucket_name="amplify-cli-pkg-fetch-nodejs-binaries" \
    binaries_tag="v3.4" \
    fourteen_version="14.21.3" \
    eighteen_version="18.15.0"
ENV linux_arm_14_binary_filename="node-v$fourteen_version-linux-arm64" \
    linux_x64_14_binary_filename="node-v$fourteen_version-linux-x64" \
    win_arm_14_binary_filename="node-v$fourteen_version-win-arm64" \
    win_x64_14_binary_filename="node-v$fourteen_version-win-x64" \
    mac_x64_14_binary_filename="node-v$fourteen_version-macos-x64" \
    linux_arm_18_binary_filename="node-v$eighteen_version-linux-arm64" \
    linux_x64_18_binary_filename="node-v$eighteen_version-linux-x64" \
    win_arm_18_binary_filename="node-v$eighteen_version-win-arm64" \
    win_x64_18_binary_filename="node-v$eighteen_version-win-x64" \
    mac_x64_18_binary_filename="node-v$eighteen_version-macos-x64" \
    linux_arm_14_binary_filename_fetched="fetched-v$fourteen_version-linux-arm64" \
    linux_x64_14_binary_filename_fetched="fetched-v$fourteen_version-linux-x64" \
    win_arm_14_binary_filename_fetched="fetched-v$fourteen_version-win-arm64" \
    win_x64_14_binary_filename_fetched="fetched-v$fourteen_version-win-x64" \
    mac_x64_14_binary_filename_fetched="fetched-v$fourteen_version-macos-x64" \
    linux_arm_18_binary_filename_fetched="fetched-v$eighteen_version-linux-arm64" \
    linux_x64_18_binary_filename_fetched="fetched-v$eighteen_version-linux-x64" \
    win_arm_18_binary_filename_fetched="fetched-v$eighteen_version-win-arm64" \
    win_x64_18_binary_filename_fetched="fetched-v$eighteen_version-win-x64" \
    mac_x64_18_binary_filename_fetched="fetched-v$eighteen_version-macos-x64"
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
ENV GRADLE_HOME=/opt/gradle/gradle-6.3 \
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
